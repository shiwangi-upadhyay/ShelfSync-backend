import { Router } from "express";
import TeamController from "../controllers/teamController";
import { requireAuth } from "../middleware/auth";
import { requireTeamAdmin, requireTeamMember } from "../middleware/permissions";

const router = Router();

router.post("/", requireAuth, TeamController.createTeam);
router.get("/", requireAuth, TeamController.getTeamsForUser);
router.get("/:id", requireAuth, requireTeamMember, TeamController.getTeamById);

// admin-only operations
router.patch("/:id", requireAuth, requireTeamAdmin, TeamController.updateTeam);
router.delete("/:id", requireAuth, requireTeamAdmin, TeamController.deleteTeam);
router.post("/:id/members", requireAuth, requireTeamAdmin, TeamController.addMember);
router.delete("/:id/members/:memberId", requireAuth, requireTeamAdmin, TeamController.removeMember);

export default router;