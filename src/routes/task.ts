import { Router } from "express";
import TaskController from "../controllers/taskController";
import { requireAuth } from "../middleware/auth";
import { requireTeamMember, requireTeamAdmin } from "../middleware/permissions";
import { requireCanCreateTask } from "../middleware/auth"; // your existing middleware

const router = Router();

// Create task (requires permission via requireCanCreateTask)
router.post("/", requireAuth, requireCanCreateTask, TaskController.createTask);

// Team tasks (any team member)
router.get("/team/:teamId", requireAuth, requireTeamMember, TaskController.getTasksForTeam);

// View a task (team member)
router.get("/:id", requireAuth, requireTeamMember, TaskController.getTaskById);

// Partial update (admin)
router.patch("/:id", requireAuth, requireTeamAdmin, TaskController.updateTask);

// Add comment (team members)
router.post("/:id/comments", requireAuth, requireTeamMember, TaskController.addComment);

// Update progress/status (team members)
router.patch("/:id/progress", requireAuth, requireTeamMember, TaskController.updateProgressField);
router.patch("/:id/status", requireAuth, requireTeamMember, TaskController.updateTaskStatus);

export default router;