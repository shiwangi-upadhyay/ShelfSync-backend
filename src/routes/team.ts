import { Router } from "express";
import TeamController from "../controllers/teamController";
import { requireAuth, requireCanCreateTask} from "../middleware/auth";


const router = Router();

// Create a new team (any authenticated user)
router.post("/", requireAuth, TeamController.createTeam);

// Get all teams for the current user
router.get("/", requireAuth, TeamController.getTeamsForUser);

// Get a specific team by ID (any authenticated user who is a member)
router.get("/:id", requireAuth, TeamController.getTeamById);

// Update a team (only team admin!)
router.put("/:id", requireAuth,requireCanCreateTask, TeamController.updateTeam);

// Delete a team (only team admin!)
router.delete("/:id", requireAuth, requireCanCreateTask, TeamController.deleteTeam);

// Add a member to a team (only team admin!)
router.post("/:id/members", requireAuth, requireCanCreateTask, TeamController.addMember);

// Remove a member from a team (only team admin!)
router.delete("/:id/members", requireAuth, requireCanCreateTask, TeamController.removeMember);

export default router;