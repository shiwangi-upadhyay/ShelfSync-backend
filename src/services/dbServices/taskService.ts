import Task, { ITask } from "../../models/task";
import { Types } from "mongoose";

export class TaskService {
  static async createTask({
    teamId, desc, topic, subTopic, startDate, endDate, priority, assignedTo, assignedBy
  }: {
    teamId: string;
    desc: string;
    topic?: string;
    subTopic?: string;
    startDate?: Date;
    endDate?: Date;
    priority?: "low" | "medium" | "high";
    assignedTo?: string[];
    assignedBy?: string; 
  }) {
    console.log(`[TaskService.createTask] teamId=${teamId} desc="${desc}" assignedTo=${JSON.stringify(assignedTo)} assignedBy=${assignedBy}`);
    // Defensive duplicate check: if a task with the same team, desc and assignedBy
    // was created very recently (e.g. within the last 10 seconds), return it
    // instead of inserting a duplicate. This handles client double-submits or
    // rapid retries.
    try {
      const recent = await Task.findOne({ team: teamId, desc: desc, assignedBy: assignedBy }).sort({ createdAt: -1 }).lean();
      if (recent && recent.createdAt) {
        const ageMs = Date.now() - new Date(recent.createdAt).getTime();
        if (ageMs < 10000) {
          console.log(`[TaskService.createTask] found recent matching task ${recent._id} (ageMs=${ageMs}), returning existing to avoid duplicate`);
          // Populate before returning to match usual return shape
          const populatedRecent = await Task.findById(recent._id)
            .populate("assignedTo", "name email avatarUrl")
            .populate("assignedBy", "name email avatarUrl")
            .populate("comments.by", "name avatarUrl")
            .populate("progressFields.by", "name avatarUrl")
            .populate("team", "name");
          return populatedRecent;
        }
      }
    } catch (e) {
      console.warn('[TaskService.createTask] duplicate detection failed, continuing to create:', e);
    }
    const task = await Task.create({
      team: teamId,
      desc,
      topic,
      subTopic,
      startDate,
      endDate,
      priority,
      assignedTo,
      assignedBy,
      status: "not started",
    });
    console.log(`[TaskService.createTask] created task._id=${task._id}`);
    // Return fully populated
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.createTask] populated task returned: ${populated?._id}`);
    return populated;
  }

  static async findTasksForTeam(teamId: string) {
    console.log(`[TaskService.findTasksForTeam] teamId=${teamId}`);
    const tasks = await Task.find({ team: teamId })
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl");
    console.log(`[TaskService.findTasksForTeam] found ${tasks.length} tasks for team ${teamId}`);
    // Log a small sample to help debugging population issues
    tasks.slice(0, 5).forEach((t) => {
      try {
        const assignedToSample = Array.isArray(t.assignedTo)
          ? t.assignedTo.map((a: any) => (a ? (a._id ? `${a._id} (populated)` : `${a}`) : "null")).slice(0, 5)
          : String(t.assignedTo);
        console.log(`[TaskService.findTasksForTeam] sample task ${t._id} assignedTo: ${JSON.stringify(assignedToSample)}`);
      } catch (e) {
        console.log(`[TaskService.findTasksForTeam] error logging sample for task ${t._id}:`, e);
      }
    });
    return tasks;
  }

  static async findById(taskId: string) {
    console.log(`[TaskService.findById] taskId=${taskId}`);
    const t = await Task.findById(taskId)
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.findById] result for ${taskId}: ${t ? "found" : "not found"}`);
    return t;
  }

  static async update(taskId: string, update: Partial<ITask>) {
    console.log(`[TaskService.update] taskId=${taskId} update=${JSON.stringify(update)}`);
    const t = await Task.findByIdAndUpdate(taskId, update, { new: true, runValidators: true })
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.update] updated task ${taskId}: ${t ? "ok" : "not found"}`);
    return t;
  }

  static async delete(taskId: string) {
    console.log(`[TaskService.delete] taskId=${taskId}`);
    const result = await Task.findByIdAndDelete(taskId);
    console.log(`[TaskService.delete] deleted=${!!result}`);
    return !!result;
  }

  static async addComment(taskId: string, comment: { by: string; text: string; date: Date }) {
    console.log(`[TaskService.addComment] taskId=${taskId} by=${comment.by} text="${comment.text}"`);
    const t = await Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.addComment] returned task ${t?._id}`);
    return t;
  }

  static async addFile(taskId: string, file: { url: string; name: string; uploadedBy: string; date: Date }) {
    console.log(`[TaskService.addFile] taskId=${taskId} file=${file.name} uploadedBy=${file.uploadedBy}`);
    const t = await Task.findByIdAndUpdate(
      taskId,
      { $push: { refFiles: file } },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("refFiles.uploadedBy", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.addFile] returned task ${t?._id}`);
    return t;
  }

  static async updateTaskStatus(
    taskId: string,
    status: "not started" | "in progress" | "completed" | "closed"
  ) {
    console.log(`[TaskService.updateTaskStatus] taskId=${taskId} status=${status}`);
    const t = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.updateTaskStatus] returned task ${t?._id}`);
    return t;
  }

  static async addProgressField(
    taskId: string,
    progress: { title: string; value: string; by: string; date: Date }
  ) {
    console.log(`[TaskService.addProgressField] taskId=${taskId} progress=${JSON.stringify(progress)}`);
    const t = await Task.findByIdAndUpdate(
      taskId,
      { $push: { progressFields: progress } },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("progressFields.by", "name avatarUrl")
      .populate("team", "name");
    console.log(`[TaskService.addProgressField] returned task ${t?._id}`);
    return t;
  }
}