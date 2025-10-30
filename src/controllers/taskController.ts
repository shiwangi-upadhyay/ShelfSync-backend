import { Request, Response } from "express";
import { TaskService } from "../services/dbServices/taskService";
import Task from "../models/task";
import mongoose from "mongoose";
import Team from "../models/team";
import NotificationService from "../services/NotificationService";

export default class TaskController {
  static async createTask(req: Request, res: Response) {
    try {
      const { teamId, tasks } = req.body;
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const team = await Team.findById(teamId).populate("admin").populate("members.user");
      if (!team) return res.status(404).json({ error: "Team not found" });

      const isAdmin = String((team.admin as any)?._id ?? team.admin) === String(userId);
      const canCreate = isAdmin || (team.members || []).some((m: any) => {
        const u = m?.user;
        const idStr = (u && u._id) ? String(u._id) : String(u);
        return idStr === String(userId) && !!m.canCreateTask;
      });
      if (!canCreate) return res.status(403).json({ error: "Forbidden: You do not have permission to create tasks for this team." });

      const created: any[] = [];
      for (const t of tasks ?? []) {
        // Normalize and sanitize assignedTo so Mongoose receives an array of ids (no empty strings)
        if (!t.desc) continue;

        let assignedTo: any = t.assignedTo;
        if (typeof assignedTo === "string") {
          // try to parse JSON string like "[\"id1\",\"id2\"]"
          try {
            assignedTo = JSON.parse(assignedTo);
          } catch (e) {
            // fallback: split on commas (e.g. "id1,id2")
            assignedTo = assignedTo.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }

        if (!Array.isArray(assignedTo) || !assignedTo.length) continue;

        // remove any empty/falsy entries
        assignedTo = assignedTo.filter((x: any) => !!String(x).trim());
        if (!assignedTo.length) continue;

        const task = await TaskService.createTask({
          teamId,
          desc: t.desc,
          topic: t.topic,
          subTopic: t.subTopic,
          startDate: t.startDate,
          endDate: t.endDate,
          priority: t.priority,
          assignedTo,
          assignedBy: userId,
        } as any);
        if (!task) continue;
        const fullTask = await Task.findById(String(task._id))
          .populate("assignedTo", "name email avatarUrl")
          .populate("assignedBy", "name email avatarUrl")
          .populate("comments.by", "name avatarUrl")
          .populate("team", "name");
        if (fullTask) {
          created.push(fullTask);

          // Send notification to all assigned user
          const assignedByUser = fullTask.assignedBy as any;
          const teamName = (fullTask.team as any)?.name || "your name"

          for (let assignee of fullTask.assignedTo as any[]) {
            try {
              await NotificationService.sendNotification({
                userId: String(assignee._id),
                title: "New Task Assigned",
                message: `${assignedByUser.name} assigned you a task: "${t.desc}" in ${teamName}`,
                metadata: {
                  taskId: String(fullTask._id),
                  teamId: String(teamId),
                  taskDesc: t.desc,
                  topic: t.topic,
                  subTopic: t.subTopic,
                  priority: t.priority,
                  startDate: t.startDate,
                  endDate: t.endDate,
                  assignedBy: assignedByUser.name,
                  type: "task_assignment"
                }
              })
            } catch (notifErr) {
              console.error(`Failed to send notification to user ${assignee._id}:`, notifErr);
              // Don't fail the task creation if notification fails
            }
          }

        }
      }
      return res.status(201).json({ created });
    } catch (err: any) {
      console.error("[TaskController.createTask] error:", err);
      return res.status(400).json({ error: err?.message || "Failed to create tasks" });
    }
  }

  static async getTasksForTeam(req: Request, res: Response) {
    try {
      const teamId = req.params.teamId;
      const tasks = await TaskService.findTasksForTeam(teamId);
      return res.json(tasks);
    } catch (err: any) {
      console.error("[TaskController.getTasksForTeam] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to fetch tasks" });
    }
  }

  static async getTaskById(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const task = await TaskService.findById(id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      return res.json(task);
    } catch (err: any) {
      console.error("[TaskController.getTaskById] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to fetch task" });
    }
  }

  static async updateTask(req: Request, res: Response) {
    try {
      const updated = await TaskService.update(req.params.id, req.body as any);
      if (!updated) return res.status(404).json({ error: "Task not found" });

      const populated = await Task.findById(req.params.id)
        .populate("assignedTo", "name email avatarUrl")
        .populate("assignedBy", "name email avatarUrl")
        .populate("comments.by", "name avatarUrl")
        .populate("team", "name members admin")
        .lean();

      return res.json(populated);
    } catch (err: any) {
      console.error("[TaskController.updateTask] error:", err);
      return res.status(400).json({ error: err?.message || "Failed to update task" });
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      const success = await TaskService.delete(req.params.id);
      if (!success) return res.status(404).json({ error: "Task not found" });
      return res.json({ message: "Task deleted" });
    } catch (err: any) {
      console.error("[TaskController.deleteTask] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to delete task" });
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const userId = req.user?.userId;
      if (!text || !userId) return res.status(400).json({ error: "Text and user required" });

      const task = await Task.findById(id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const teamId = String((task.team as any)?._id ?? task.team);
      const team = await Team.findById(teamId).populate("admin").populate("members.user");
      if (!team) return res.status(404).json({ error: "Team not found" });

      const isMember =
        String((team.admin as any)?._id ?? team.admin) === String(userId) ||
        (team.members || []).some((m: any) => {
          const u = m?.user;
          const idStr = (u && u._id) ? String(u._id) : String(u);
          return idStr === String(userId);
        });

      if (!isMember) return res.status(403).json({ error: "Forbidden: Not a team member" });

      const comment = {
        text,
        by: new mongoose.Types.ObjectId(userId),
        date: new Date(),
      };
      task.comments.push(comment);
      await task.save();

      const populatedTask = await Task.findById(id)
        .populate("assignedTo", "name email avatarUrl")
        .populate("assignedBy", "name email avatarUrl")
        .populate("comments.by", "name avatarUrl")
        .populate("team", "name");

      return res.json(populatedTask);
    } catch (err: any) {
      console.error("[TaskController.addComment] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to add comment" });
    }
  }

  static async addFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file as any;
      const userId = req.user?.userId;
      if (!userId) return res.status(400).json({ error: "User ID required" });
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const task = await Task.findById(id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const teamId = String((task.team as any)?._id ?? task.team);
      const team = await Team.findById(teamId).populate("admin").populate("members.user");
      if (!team) return res.status(404).json({ error: "Team not found" });

      const isMember =
        String((team.admin as any)?._id ?? team.admin) === String(userId) ||
        (team.members || []).some((m: any) => {
          const u = m?.user;
          const idStr = (u && u._id) ? String(u._id) : String(u);
          return idStr === String(userId);
        });

      if (!isMember) return res.status(403).json({ error: "Forbidden: Not a team member" });

      const userObjectId = new mongoose.Types.ObjectId(userId);

      task.refFiles.push({
        url: `/uploads/${file.filename}`,
        name: file.originalname,
        uploadedBy: userObjectId,
        date: new Date(),
      });
      await task.save();

      const populatedTask = await Task.findById(id)
        .populate("refFiles.uploadedBy", "name")
        .lean();

      if (!populatedTask) return res.status(404).json({ error: "Task not found" });

      return res.json(populatedTask.refFiles);
    } catch (err: any) {
      console.error("[TaskController.addFile] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to add file" });
    }
  }

  static async updateTaskStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const task = await Task.findById(req.params.id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const userId: string | undefined = req.user?.userId;
      if (!userId) return res.status(400).json({ error: "User ID required" });

      const teamId = String((task.team as any)?._id ?? task.team);
      const team = await Team.findById(teamId).populate("admin").populate("members.user");
      if (!team) return res.status(404).json({ error: "Team not found" });

      const isMember =
        String((team.admin as any)?._id ?? team.admin) === String(userId) ||
        (team.members || []).some((m: any) => {
          const u = m?.user;
          const idStr = (u && u._id) ? String(u._id) : String(u);
          return idStr === String(userId);
        });

      if (!isMember) return res.status(403).json({ error: "Forbidden: Not a team member" });

      if (!["not started", "in progress", "completed", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      task.status = status;
      await task.save();

      return res.json({ status: task.status });
    } catch (err: any) {
      console.error("[TaskController.updateTaskStatus] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to update status" });
    }
  }

  static async updateProgressField(req: Request, res: Response) {
    try {
      const { title, value } = req.body;
      const userId = req.user?.userId;
      if (!userId) return res.status(400).json({ error: "User ID required" });

      const task = await Task.findById(req.params.id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const teamId = String((task.team as any)?._id ?? task.team);
      const team = await Team.findById(teamId).populate("admin").populate("members.user");
      if (!team) return res.status(404).json({ error: "Team not found" });

      const isMember =
        String((team.admin as any)?._id ?? team.admin) === String(userId) ||
        (team.members || []).some((m: any) => {
          const u = m?.user;
          const idStr = (u && u._id) ? String(u._id) : String(u);
          return idStr === String(userId);
        });

      if (!isMember) return res.status(403).json({ error: "Forbidden: Not a team member" });

      task.progressFields.push({
        title,
        value,
        by: new mongoose.Types.ObjectId(userId),
        date: new Date(),
      });
      await task.save();

      const populatedTask = await Task.findById(req.params.id)
        .populate("progressFields.by", "name avatarUrl")
        .lean();

      if (!populatedTask) return res.status(404).json({ error: "Task not found" });

      return res.json(populatedTask.progressFields);
    } catch (err: any) {
      console.error("[TaskController.updateProgressField] error:", err);
      return res.status(500).json({ error: err?.message || "Failed to update progress" });
    }
  }
}