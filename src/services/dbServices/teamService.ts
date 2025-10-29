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
    console.log(`[TeamService.createTeam] name="${name}" adminId=${adminId} membersCount=${members?.length ?? 0}`);
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
    const full = await Team.findById(team._id)
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
    console.log(`[TeamService.createTeam] created team ${full?._id} members=${full?.members?.length}`);
    return full;
  }

  static async findTeamsForUser(userId: string) {
    console.log(`[TeamService.findTeamsForUser] userId=${userId}`);
    const teams = await Team.find({
      $or: [{ "members.user": userId }, { admin: userId }],
    })
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
    console.log(`[TeamService.findTeamsForUser] found ${teams.length} teams for user ${userId}`);
    teams.forEach((t) => {
      console.log(`[TeamService.findTeamsForUser] team ${t._id} members sample: ${JSON.stringify((t.members || []).slice(0,5))}`);
    });
    return teams;
  }

  static async findById(teamId: string) {
    console.log(`[TeamService.findById] teamId=${teamId}`);
    const t = await Team.findById(teamId)
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
    console.log(`[TeamService.findById] team ${teamId} ${t ? "found" : "not found"} members=${t?.members?.length ?? 0}`);
    return t;
  }

  static async update(teamId: string, update: Partial<ITeam>) {
    console.log(`[TeamService.update] teamId=${teamId} update=${JSON.stringify(update)}`);
    const t = await Team.findByIdAndUpdate(teamId, update, { new: true })
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
    console.log(`[TeamService.update] updated team ${teamId} members=${t?.members?.length ?? 0}`);
    return t;
  }

  static async addMember(
    teamId: string,
    userId: string,
    canCreateTask = false
  ) {
    console.log(`[TeamService.addMember] teamId=${teamId} userId=${userId} canCreateTask=${canCreateTask}`);
    const t = await Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: { user: userId, canCreateTask } } },
      { new: true }
    )
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
    console.log(`[TeamService.addMember] team ${teamId} now has ${t?.members?.length ?? 0} members`);
    return t;
  }

  static async removeMember(teamId: string, userId: string) {
    console.log(`[TeamService.removeMember] teamId=${teamId} userId=${userId}`);
    const t = await Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: { user: userId } } },
      { new: true }
    )
      .populate("admin", "name email avatarUrl")
      .populate("members.user", "name email avatarUrl");
    console.log(`[TeamService.removeMember] team ${teamId} now has ${t?.members?.length ?? 0} members`);
    return t;
  }
}