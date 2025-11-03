import Team, { ITeam, ITeamMember } from "../../models/team";
import User from "../../models/user";
import Project from "../../models/project"
import mongoose from "mongoose";

export class TeamService {
  static async createTeam({
    name,
    members,
    adminId,
    projectId,
  }: {
    name: string;
    members: ITeamMember[];
    adminId: string;
    projectId: string
  }) {
    console.log(`[TeamService.createTeam] name="${name}" adminId=${adminId} membersCount=${members?.length ?? 0}`);
    const adminMember: ITeamMember = { user: new mongoose.Types.ObjectId(adminId), canCreateTask: true };
    const uniqueMembers: ITeamMember[] = [
      adminMember,
      ...members
        .filter((m) => String(m.user) !== adminId)
        .map((m) => ({
          user: new mongoose.Types.ObjectId(m.user),
          canCreateTask: !!m.canCreateTask,
        })),
    ];
    const team = await Team.create({
      name,
      admin: adminId,
      members: uniqueMembers,
      project: projectId
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
      console.log(`[TeamService.findTeamsForUser] team ${t._id} members sample: ${JSON.stringify((t.members || []).slice(0, 5))}`);
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


  // New methods for project integration
  static async findByProject(projectId: string) {
    console.log(`[TeamService.findByProject] projectId=${projectId}`);
    return await Team.find({ project: projectId })
      .populate("admin", "name email")
      .populate("members.user", "name email memberType")
      .sort({ createdAt: -1 });
  }

  static async updateMemberPermission(
    teamId: string,
    userId: string,
    canCreateTask: boolean
  ) {
    console.log(
      `[TeamService.updateMemberPermission] teamId=${teamId} userId=${userId} canCreateTask=${canCreateTask}`
    );
    return await Team.findOneAndUpdate(
      { _id: teamId, "members.user": userId },
      { $set: { "members.$.canCreateTask": canCreateTask } },
      { new: true }
    )
      .populate("admin", "name email")
      .populate("members.user", "name email");
  }

  static async getTeamMembers(teamId: string) {
    console.log(`[TeamService.getTeamMembers] teamId=${teamId}`);
    const team = await Team.findById(teamId).populate(
      "members.user",
      "name email memberType"
    );

    return team ? team.members : [];
  }

  static async count(): Promise<number> {
    return await Team.countDocuments();
  }

  static async countByProject(projectId: string): Promise<number> {
    return await Team.countDocuments({ project: projectId });
  }

  static async delete(teamId: string): Promise<boolean> {
    console.log(`[TeamService.delete] teamId=${teamId}`);
    const team = await Team.findById(teamId);
    if (!team) return false;

    // Remove team from all users
    const memberIds = team.members.map((m) => m.user);
    await User.updateMany({ _id: { $in: memberIds } }, { $pull: { teams: teamId } });

    // Remove team from project
    await Project.findByIdAndUpdate(team.project, {
      $pull: { teams: teamId },
    });

    const result = await Team.findByIdAndDelete(teamId);
    return !!result;
  }
}