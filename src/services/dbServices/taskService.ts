import Task, { ITask } from "../../models/task";
import { Types } from "mongoose";

export class TaskService {
  static async createTask({
    teamId, desc, topic, subTopic, startDate, endDate, priority, assignedTo
  }: {
    teamId: string;
    desc: string;
    topic?: string;
    subTopic?: string;
    startDate?: Date;
    endDate?: Date;
    priority?: "low" | "medium" | "high";
    assignedTo?: string[];
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
      status: "not started"
    });
    return task;
  }

  static async findTasksForTeam(teamId: string) {
    return Task.find({ team: teamId }).populate("assignedTo", "name email");
  }

  static async findById(taskId: string) {
    return Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("team", "name");
  }

  static async update(taskId: string, update: Partial<ITask>) {
    return Task.findByIdAndUpdate(taskId, update, { new: true })
      .populate("assignedTo", "name email")
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
    );
  }

  static async addFile(taskId: string, file: { url: string; name: string; uploadedBy: string; date: Date }) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { refFiles: file } },
      { new: true }
    );
  }

  static async addProgressField(taskId: string, progress: { title: string; value: string; by: string; date: Date }) {
    return Task.findByIdAndUpdate(
      taskId,
      { $push: { progressFields: progress } },
      { new: true }
    );
  }
}