"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const task_1 = __importDefault(require("../../models/task"));
class TaskService {
    static async createTask({ teamId, desc, topic, subTopic, startDate, endDate, priority, assignedTo }) {
        const task = await task_1.default.create({
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
    static async findTasksForTeam(teamId) {
        return task_1.default.find({ team: teamId }).populate("assignedTo", "name email");
    }
    static async findById(taskId) {
        return task_1.default.findById(taskId)
            .populate("assignedTo", "name email")
            .populate("team", "name");
    }
    static async update(taskId, update) {
        return task_1.default.findByIdAndUpdate(taskId, update, { new: true })
            .populate("assignedTo", "name email")
            .populate("team", "name");
    }
    static async delete(taskId) {
        const result = await task_1.default.findByIdAndDelete(taskId);
        return !!result;
    }
    static async addComment(taskId, comment) {
        return task_1.default.findByIdAndUpdate(taskId, { $push: { comments: comment } }, { new: true });
    }
    static async addFile(taskId, file) {
        return task_1.default.findByIdAndUpdate(taskId, { $push: { refFiles: file } }, { new: true });
    }
    static async updateTaskStatus(taskId, status) {
        return task_1.default.findByIdAndUpdate(taskId, { status }, { new: true });
    }
    static async addProgressField(taskId, progress) {
        return task_1.default.findByIdAndUpdate(taskId, { $push: { progressFields: progress } }, { new: true });
    }
}
exports.TaskService = TaskService;
