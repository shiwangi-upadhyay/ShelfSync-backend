import Team, { ITeam } from "../../models/team";
import User from "../../models/user";

export class TeamService {
  static async createTeam({ name, memberIds, adminId }: { name: string; memberIds?: string[]; adminId: string }) {
    // Ensure admin is always a member (avoid duplicates)
    const members = Array.from(new Set([adminId, ...(memberIds || [])]));
    const team = await Team.create({
      name,
      admin: adminId,
      members,
    });
    // Always populate admin and members before returning
    return Team.findById(team._id)
      .populate("admin", "name email avatarUrl")
      .populate("members", "name email avatarUrl");
  }

  static async findTeamsForUser(userId: string) {
    return Team.find({
      $or: [
        { members: userId },
        { admin: userId }
      ]
    })
      .populate("admin", "name email avatarUrl")
      .populate("members", "name email avatarUrl");
  }

  static async findById(teamId: string) {
    return Team.findById(teamId)
      .populate("admin", "name email avatarUrl")
      .populate("members", "name email avatarUrl");
  }

  static async update(teamId: string, update: Partial<ITeam>) {
    return Team.findByIdAndUpdate(teamId, update, { new: true })
      .populate("admin", "name email avatarUrl")
      .populate("members", "name email avatarUrl");
  }

  static async delete(teamId: string) {
    const result = await Team.findByIdAndDelete(teamId);
    return !!result;
  }

  static async addMember(teamId: string, userId: string) {
    return Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate("admin", "name email avatarUrl")
      .populate("members", "name email avatarUrl");
  }

  static async removeMember(teamId: string, userId: string) {
    return Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate("admin", "name email avatarUrl")
      .populate("members", "name email avatarUrl");
  }
}