import { Request, Response } from "express";
import { TaskService } from "../services/dbServices/taskService";
import Task from "../models/task";
import mongoose from "mongoose";
import Team from "../models/team";

export default class TaskController {
  static async createTask(req: Request, res: Response) {
    try {
      const { teamId, tasks } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      // Find team and populate admin and members.user for permission check
      const team = await Team.findById(teamId).populate("admin").populate("members.user");
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Permission: Only admin or member with canCreateTask may create tasks
      const isAdmin = team.admin._id.toString() === userId;
      const canCreate = isAdmin || team.members.some(
        (m: any) =>
          m.user &&
          (m.user._id?.toString?.() || m.user.toString()) === userId &&
          m.canCreateTask
      );
      if (!canCreate) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to create tasks for this team." });
      }

      const created = [];
      for (const t of (tasks ?? [])) {
        if (!t.desc || !t.assignedTo?.length) continue;
        const task = await TaskService.createTask({
          teamId,
          desc: t.desc,
          topic: t.topic,
          subTopic: t.subTopic,
          startDate: t.startDate,
          endDate: t.endDate,
          priority: t.priority,
          assignedTo: t.assignedTo,
          assignedBy: userId, 
        } as any);
        created.push(task);
      }

      res.status(201).json({ created });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getTasksForTeam(req: Request, res: Response) {
    try {
      const tasks = await TaskService.findTasksForTeam(req.params.teamId);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getTaskById(req: Request, res: Response) {
    try {
      const task = await TaskService.findById(req.params.id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateTask(req: Request, res: Response) {
    try {
      const task = await TaskService.update(req.params.id, req.body);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      const success = await TaskService.delete(req.params.id);
      if (!success) return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Task deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const userId = req.user?.userId;
      if (!text || !userId)
        return res.status(400).json({ error: "Text and user required" });

      const task = await Task.findById(id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const teamId = task.team._id.toString();
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const isMember =
        team.admin.toString() === userId ||
        team.members.some(
          (m: any) =>
            m.user &&
            (m.user._id?.toString?.() || m.user.toString()) === userId
        );
      if (!isMember) {
        return res.status(403).json({ error: "Forbidden: Not a team member" });
      }

      const comment = {
        text,
        by: new mongoose.Types.ObjectId(userId),
        date: new Date(),
      };
      task.comments.push(comment);
      await task.save();

      const populatedTask = await task.populate(
        "comments.by",
        "name avatarUrl"
      );
      res.json(populatedTask.comments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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

      const teamId = task.team._id.toString();
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const isMember =
        team.admin.toString() === userId ||
        team.members.some(
          (m: any) =>
            m.user &&
            (m.user._id?.toString?.() || m.user.toString()) === userId
        );
      if (!isMember) {
        return res.status(403).json({ error: "Forbidden: Not a team member" });
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);

      task.refFiles.push({
        url: `/uploads/${file.filename}`,
        name: file.originalname,
        uploadedBy: userObjectId,
        date: new Date(),
      });
      await task.save();
      res.json(task.refFiles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateTaskStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status required" });

      const task = await Task.findById(req.params.id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const userId: string | undefined = req.user?.userId;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      const teamId = task.team._id.toString();
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const isMember =
        team.admin.toString() === userId ||
        team.members.some(
          (m: any) =>
            m.user &&
            (m.user._id?.toString?.() || m.user.toString()) === userId
        );
      if (!isMember) {
        return res.status(403).json({ error: "Forbidden: Not a team member" });
      }

      if (!["not started", "in progress", "completed", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      task.status = status;
      await task.save();

      res.json({ status: task.status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateProgressField(req: Request, res: Response) {
    try {
      const { title, value } = req.body;
      const userId = req.user?.userId;
      if (!userId) return res.status(400).json({ error: "User ID required" });

      const task = await Task.findById(req.params.id).populate("team");
      if (!task) return res.status(404).json({ error: "Task not found" });

      const teamId = task.team._id.toString();
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      const isMember =
        team.admin.toString() === userId ||
        team.members.some(
          (m: any) =>
            m.user &&
            (m.user._id?.toString?.() || m.user.toString()) === userId
        );
      if (!isMember) {
        return res.status(403).json({ error: "Forbidden: Not a team member" });
      }

      task.progressFields.push({
        title,
        value,
        by: new mongoose.Types.ObjectId(userId),
        date: new Date(),
      });
      await task.save();
      res.json(task.progressFields);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}