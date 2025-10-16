"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const taskService_1 = require("../services/dbServices/taskService");
const task_1 = __importDefault(require("../models/task"));
const teamAuth_1 = require("../utils/teamAuth");
const mongoose_1 = __importDefault(require("mongoose"));
const team_1 = __importDefault(require("../models/team"));
// import { File as MulterFile } from "multer";
class TaskController {
    static async createTask(req, res) {
        try {
            // Log the full request body
            console.log("[TaskController] Incoming payload:", JSON.stringify(req.body, null, 2));
            const { teamId, tasks } = req.body;
            console.log("[TaskController] teamId received:", teamId);
            // Log tasks array length
            console.log("[TaskController] Number of tasks to create:", Array.isArray(tasks) ? tasks.length : 0);
            // Check if team exists
            const team = await team_1.default.findById(teamId);
            if (!team) {
                console.error("[TaskController] Team not found for id:", teamId);
                return res.status(404).json({ error: "Team not found" });
            }
            console.log("[TaskController] Team found:", team);
            const created = [];
            for (const [i, t] of tasks.entries()) {
                console.log(`[TaskController] Creating task #${i + 1}:`, t);
                if (!t.desc || !t.assignedTo?.length) {
                    console.warn(`[TaskController] Skipping incomplete task #${i + 1}:`, t);
                    continue;
                }
                const task = await taskService_1.TaskService.createTask({
                    teamId,
                    desc: t.desc,
                    topic: t.topic,
                    subTopic: t.subTopic,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    priority: t.priority,
                    assignedTo: t.assignedTo,
                });
                console.log(`[TaskController] Task #${i + 1} created:`, task);
                created.push(task);
            }
            console.log(`[TaskController] Total tasks created: ${created.length}`);
            res.status(201).json({ created });
        }
        catch (err) {
            console.error("[TaskController] Error in createTask:", err);
            res.status(400).json({ error: err.message });
        }
    }
    static async getTasksForTeam(req, res) {
        try {
            const tasks = await taskService_1.TaskService.findTasksForTeam(req.params.teamId);
            res.json(tasks);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async getTaskById(req, res) {
        try {
            const task = await taskService_1.TaskService.findById(req.params.id);
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            res.json(task);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateTask(req, res) {
        try {
            const task = await taskService_1.TaskService.update(req.params.id, req.body);
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            res.json(task);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async deleteTask(req, res) {
        try {
            const success = await taskService_1.TaskService.delete(req.params.id);
            if (!success)
                return res.status(404).json({ error: "Task not found" });
            res.json({ message: "Task deleted" });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async addComment(req, res) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const userId = req.user?.userId;
            if (!text || !userId)
                return res.status(400).json({ error: "Text and user required" });
            const task = await task_1.default.findById(id).populate("team");
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            const teamId = task.team._id.toString();
            if (!(await (0, teamAuth_1.isTeamMember)(teamId, userId))) {
                return res.status(403).json({ error: "Forbidden: Not a team member" });
            }
            const comment = {
                text,
                by: new mongoose_1.default.Types.ObjectId(userId),
                date: new Date(),
            };
            task.comments.push(comment);
            await task.save();
            const populatedTask = await task.populate("comments.by", "name avatarUrl");
            res.json(populatedTask.comments);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async addFile(req, res) {
        try {
            const { id } = req.params;
            const file = req.file; // Type assertion
            const userId = req.user?.userId;
            if (!userId)
                return res.status(400).json({ error: "User ID required" });
            if (!file)
                return res.status(400).json({ error: "No file uploaded" });
            const task = await task_1.default.findById(id).populate("team");
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            const teamId = task.team._id.toString();
            if (!(await (0, teamAuth_1.isTeamMember)(teamId, userId))) {
                return res.status(403).json({ error: "Forbidden: Not a team member" });
            }
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            task.refFiles.push({
                url: `/uploads/${file.filename}`,
                name: file.originalname,
                uploadedBy: userObjectId,
                date: new Date(),
            });
            await task.save();
            res.json(task.refFiles);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateTaskStatus(req, res) {
        try {
            const { status } = req.body;
            if (!status)
                return res.status(400).json({ error: "Status required" });
            const task = await task_1.default.findById(req.params.id).populate("team");
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            // Only allow status change if user is team member
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(400).json({ error: "User ID required" });
            }
            const teamId = task.team._id.toString();
            if (!(await (0, teamAuth_1.isTeamMember)(teamId, userId))) {
                return res.status(403).json({ error: "Forbidden: Not a team member" });
            }
            // Validate status value
            if (!["not started", "in progress", "completed", "closed"].includes(status)) {
                return res.status(400).json({ error: "Invalid status value" });
            }
            task.status = status;
            await task.save();
            res.json({ status: task.status });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    static async updateProgressField(req, res) {
        try {
            const { title, value } = req.body;
            const userId = req.user?.userId;
            if (!userId)
                return res.status(400).json({ error: "User ID required" });
            const task = await task_1.default.findById(req.params.id).populate("team");
            if (!task)
                return res.status(404).json({ error: "Task not found" });
            const teamId = task.team._id.toString();
            if (!(await (0, teamAuth_1.isTeamMember)(teamId, userId))) {
                return res.status(403).json({ error: "Forbidden: Not a team member" });
            }
            task.progressFields.push({
                title,
                value,
                by: new mongoose_1.default.Types.ObjectId(userId),
                date: new Date(),
            });
            await task.save();
            res.json(task.progressFields);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
exports.default = TaskController;
