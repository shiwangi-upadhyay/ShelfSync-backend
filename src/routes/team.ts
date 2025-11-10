import { Router } from "express";
import TeamController from "../controllers/teamController";
import { requireAuth, requireProjectOwnership } from "../middleware/auth";
import { requireTeamAdmin, requireTeamMember } from "../middleware/permissions";
import { validate } from "../middleware/validationMiddleware";
import { teamZod } from "../zod";

const router = Router();

router.use(requireAuth)

// Create Team - Project Owner only
router.post("/", requireProjectOwnership,
    validate(teamZod.createTeamSchema), TeamController.createTeam);

// get user's team
router.get("/my_teams", TeamController.getTeamsForUser);

// Get team by Id - must be member
router.get("/:id", validate(teamZod.getTeamByIdSchema), requireTeamMember, TeamController.getTeamById);

// Update team - team admin only
router.patch("/:id", validate(teamZod.updateTeamSchema), requireProjectOwnership, TeamController.updateTeam);

// Add member - team admin only
router.post("/:id/members", validate(teamZod.addMemberToTeamSchema), requireProjectOwnership, TeamController.addMember);

// Remove member - team admin only
router.delete("/:id/members/:memberId", requireProjectOwnership, TeamController.removeMember);

// Delete team - team admin only
router.delete("/:id", validate(teamZod.removeMemberFromTeamSchema), requireProjectOwnership, TeamController.deleteTeam);



export default router;