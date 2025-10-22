import Team, { ITeam, ITeamMember } from "../../models/team";
import User from "../../models/user";
import mongoose from "mongoose";

export class TeamService {
  static async createTeam({
    name,
    members,
    adminId,
  }: {
    name: string;
    members: { user: string; canCreateTask?: boolean }[];
    adminId: string;
  }) {

// ...
const adminMember: ITeamMember = { user: new mongoose.Types.ObjectId(adminId), canCreateTask: true };
const uniqueMembers: ITeamMember[] = [
  adminMember,
  ...members
    .filter((m) => m.user !== adminId)
    .map((m) => ({
      user: new mongoose.Types.ObjectId(m.user),
      canCreateTask: !!m.canCreateTask,
    })),
];
    const team = await Team.create({
      name,
      admin: adminId,
      members: uniqueMembers,
    });
    return Team.findById(team._id)
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
  }

  static async findTeamsForUser(userId: string) {
    return Team.find({
      $or: [{ "members.user": userId }, { admin: userId }],
    })
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
  }

  static async findById(teamId: string) {
    return Team.findById(teamId)
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
  }

  static async update(teamId: string, update: Partial<ITeam>) {
    return Team.findByIdAndUpdate(teamId, update, { new: true })
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
  }

  static async addMember(
    teamId: string,
    userId: string,
    canCreateTask = false
  ) {
    return Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: { user: userId, canCreateTask } } },
      { new: true }
    )
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
  }

  static async removeMember(teamId: string, userId: string) {
    return Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: { user: userId } } },
      { new: true }
    )
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
  }
}
