import Team from "../models/team";

export async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const team = await Team.findById(teamId);
  if (!team) return false;
  return team.members.map(m => m.toString()).includes(userId) || team.admin.toString() === userId;
}