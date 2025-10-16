import { Router } from "express";
import TaskController from "../controllers/taskController";
import { requireAuth, requireTeamAdmin } from "../middleware/auth";

const router = Router();

// Create a new task (admin only)
// router.post("/", requireAuth, requireTeamAdmin, TaskController.createTask);
router.post("/", (req, res, next) => {
  console.log("[TaskRoutes] POST /tasks hit");
  next();
}, requireAuth, requireTeamAdmin, TaskController.createTask);

// Get all tasks for a team (any authenticated user who is a team member)
router.get("/team/:teamId", requireAuth, TaskController.getTasksForTeam);

// Get a specific task by ID (any authenticated user who is a team member)
router.get("/:id", requireAuth, TaskController.getTaskById);

// Update a task (admin only for now, but can extend with assigned member check)
router.put("/:id", requireAuth, requireTeamAdmin, TaskController.updateTask);

// Delete a task (admin only)
router.delete("/:id", requireAuth, requireTeamAdmin, TaskController.deleteTask);

// Add a comment to a task (any authenticated user who is a team member)
router.post("/:id/comments", requireAuth, TaskController.addComment);

// Add a file to a task (any authenticated user who is a team member)
router.post("/:id/files", requireAuth, TaskController.addFile);

// Update progress field (any authenticated user who is a team member)
router.patch("/:id/progress", requireAuth, TaskController.updateProgressField);

// Update task status (any authenticated user who is a team member)
router.patch("/:id/status", requireAuth, TaskController.updateTaskStatus);

export default router;