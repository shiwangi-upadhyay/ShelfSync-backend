import { Request, Response, NextFunction } from "express";
import Team from "../models/team";
import Task from "../models/task";

/**
 * Resolve a teamId for the current request.
 * Priority:
 *  - req.params.teamId
 *  - req.body.teamId
 *  - If req.params.id exists:
 *      - try Team.findById(req.params.id) (handles routes like /teams/:id)
 *      - otherwise try Task.findById(req.params.id).team (handles routes like /tasks/:id)
 */
async function resolveTeamIdFromRequest(req: Request): Promise<string | null> {
  // explicit teamId path param (preferred for /tasks/team/:teamId)
  if (req.params && req.params.teamId) return String(req.params.teamId);

  // teamId in body (used in POST /tasks)
  if (req.body && req.body.teamId) return String(req.body.teamId);

  // if params.id exists, it may be either a team id or a task id.
  if (req.params && req.params.id) {
    const possibleId = req.params.id;

    // First, try treating it as a Team id.
    try {
      const team = await Team.findById(possibleId).select("_id").lean();
      if (team) return String((team as any)._id);
    } catch (e) {
      // ignore and try as task below
    }

    // Next, treat it as a Task id and read its team.
    try {
      const task = await Task.findById(possibleId).select("team").lean();
      if (task && (task as any).team) return String((task as any).team);
    } catch (e) {
      // nothing to do
    }
  }

  return null;
}

/**
 * requireTeamMember
 */
export async function requireTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: "Unauthorized" });

    const teamId = await resolveTeamIdFromRequest(req);
    if (!teamId) return res.status(400).json({ error: "Missing team identifier" });

    const team = await Team.findById(teamId).populate("admin").populate("members.user").lean();
    if (!team) return res.status(404).json({ error: "Team not found" });

    const userId = String(user.userId);
    const isAdmin = Boolean(team.admin && (String((team.admin as any)._id ?? team.admin) === userId));
    const isMember = (team.members || []).some((m: any) => {
      const u = m?.user;
      const idStr = u && u._id ? String(u._id) : String(u);
      return idStr === userId;
    });

    if (!isAdmin && !isMember) return res.status(403).json({ error: "Forbidden: You are not a member of this team" });

    (req as any).team = team;
    return next();
  } catch (err: any) {
    console.error("[requireTeamMember] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

/**
 * requireTeamAdmin
 */
export async function requireTeamAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: "Unauthorized" });

    const teamId = await resolveTeamIdFromRequest(req);
    if (!teamId) return res.status(400).json({ error: "Missing team identifier" });

    const team = await Team.findById(teamId).populate("admin").populate("members.user").lean();
    if (!team) return res.status(404).json({ error: "Team not found" });

    const userId = String(user.userId);
    const adminId = String((team.admin as any)?._id ?? team.admin);

    if (adminId !== userId) return res.status(403).json({ error: "Admin privileges required" });

    (req as any).team = team;
    return next();
  } catch (err: any) {
    console.error("[requireTeamAdmin] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}