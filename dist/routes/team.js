"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teamController_1 = __importDefault(require("../controllers/teamController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create a new team (any authenticated user)
router.post("/", auth_1.requireAuth, teamController_1.default.createTeam);
// Get all teams for the current user
router.get("/", auth_1.requireAuth, teamController_1.default.getTeamsForUser);
// Get a specific team by ID (any authenticated user who is a member)
router.get("/:id", auth_1.requireAuth, teamController_1.default.getTeamById);
// Update a team (only team admin!)
router.put("/:id", auth_1.requireAuth, auth_1.requireTeamAdmin, teamController_1.default.updateTeam);
// Delete a team (only team admin!)
router.delete("/:id", auth_1.requireAuth, auth_1.requireTeamAdmin, teamController_1.default.deleteTeam);
// Add a member to a team (only team admin!)
router.post("/:id/members", auth_1.requireAuth, auth_1.requireTeamAdmin, teamController_1.default.addMember);
// Remove a member from a team (only team admin!)
router.delete("/:id/members", auth_1.requireAuth, auth_1.requireTeamAdmin, teamController_1.default.removeMember);
exports.default = router;
