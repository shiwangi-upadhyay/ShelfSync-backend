"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const team_1 = __importDefault(require("../../models/team"));
class TeamService {
    static async createTeam({ name, memberIds, adminId }) {
        // Ensure admin is always a member (avoid duplicates)
        const members = Array.from(new Set([adminId, ...(memberIds || [])]));
        const team = await team_1.default.create({
            name,
            admin: adminId,
            members,
        });
        // Always populate admin and members before returning
        return team_1.default.findById(team._id)
            .populate("admin", "name email avatarUrl")
            .populate("members", "name email avatarUrl");
    }
    static async findTeamsForUser(userId) {
        return team_1.default.find({
            $or: [
                { members: userId },
                { admin: userId }
            ]
        })
            .populate("admin", "name email avatarUrl")
            .populate("members", "name email avatarUrl");
    }
    static async findById(teamId) {
        return team_1.default.findById(teamId)
            .populate("admin", "name email avatarUrl")
            .populate("members", "name email avatarUrl");
    }
    static async update(teamId, update) {
        return team_1.default.findByIdAndUpdate(teamId, update, { new: true })
            .populate("admin", "name email avatarUrl")
            .populate("members", "name email avatarUrl");
    }
    static async delete(teamId) {
        const result = await team_1.default.findByIdAndDelete(teamId);
        return !!result;
    }
    static async addMember(teamId, userId) {
        return team_1.default.findByIdAndUpdate(teamId, { $addToSet: { members: userId } }, { new: true })
            .populate("admin", "name email avatarUrl")
            .populate("members", "name email avatarUrl");
    }
    static async removeMember(teamId, userId) {
        return team_1.default.findByIdAndUpdate(teamId, { $pull: { members: userId } }, { new: true })
            .populate("admin", "name email avatarUrl")
            .populate("members", "name email avatarUrl");
    }
}
exports.TeamService = TeamService;
