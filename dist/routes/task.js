"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = __importDefault(require("../controllers/taskController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create a new task (admin only)
// router.post("/", requireAuth, requireTeamAdmin, TaskController.createTask);
router.post("/", (req, res, next) => {
    console.log("[TaskRoutes] POST /tasks hit");
    next();
}, auth_1.requireAuth, auth_1.requireTeamAdmin, taskController_1.default.createTask);
// Get all tasks for a team (any authenticated user who is a team member)
router.get("/team/:teamId", auth_1.requireAuth, taskController_1.default.getTasksForTeam);
// Get a specific task by ID (any authenticated user who is a team member)
router.get("/:id", auth_1.requireAuth, taskController_1.default.getTaskById);
// Update a task (admin only for now, but can extend with assigned member check)
router.put("/:id", auth_1.requireAuth, auth_1.requireTeamAdmin, taskController_1.default.updateTask);
// Delete a task (admin only)
router.delete("/:id", auth_1.requireAuth, auth_1.requireTeamAdmin, taskController_1.default.deleteTask);
// Add a comment to a task (any authenticated user who is a team member)
router.post("/:id/comments", auth_1.requireAuth, taskController_1.default.addComment);
// Add a file to a task (any authenticated user who is a team member)
router.post("/:id/files", auth_1.requireAuth, taskController_1.default.addFile);
// Update progress field (any authenticated user who is a team member)
router.patch("/:id/progress", auth_1.requireAuth, taskController_1.default.updateProgressField);
// Update task status (any authenticated user who is a team member)
router.patch("/:id/status", auth_1.requireAuth, taskController_1.default.updateTaskStatus);
exports.default = router;
