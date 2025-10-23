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
    // Return fully populated
    return Task.findById(task._id)
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }

  static async findTasksForTeam(teamId: string) {
    const tasks = await Task.find({ team: teamId })
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl");
    // Optional debug
    // console.log("POPULATED assignedTo of first task:", tasks[0]?.assignedTo);
    return tasks;
  }

  static async findById(taskId: string) {
    return Task.findById(taskId)
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }

  static async update(taskId: string, update: Partial<ITask>) {
    return Task.findByIdAndUpdate(taskId, update, { new: true })
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }

  static async delete(taskId: string) {
    const result = await Task.findByIdAndDelete(taskId);
    return !!result;
  }

  static async addComment(taskId: string, comment: { by: string; text: string; date: Date }) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }

  static async addFile(taskId: string, file: { url: string; name: string; uploadedBy: string; date: Date }) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { refFiles: file } },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }

  static async updateTaskStatus(
    taskId: string,
    status: "not started" | "in progress" | "completed" | "closed"
  ) {
    return Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }

  static async addProgressField(
    taskId: string,
    progress: { title: string; value: string; by: string; date: Date }
  ) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { progressFields: progress } },
      { new: true }
    )
      .populate("assignedTo", "name email avatarUrl")
      .populate("assignedBy", "name email avatarUrl")
      .populate("comments.by", "name avatarUrl")
      .populate("team", "name");
  }
}