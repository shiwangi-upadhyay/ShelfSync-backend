"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTeamMember = isTeamMember;
const team_1 = __importDefault(require("../models/team"));
async function isTeamMember(teamId, userId) {
    const team = await team_1.default.findById(teamId);
    if (!team)
        return false;
    return team.members.map(m => m.toString()).includes(userId) || team.admin.toString() === userId;
}
