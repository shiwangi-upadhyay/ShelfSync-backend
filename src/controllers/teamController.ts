import { Request, Response } from "express";
import { TeamService } from "../services/dbServices/teamService";

export default class TeamController {
  static async createTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId || typeof userId !== "string") {
        return res
          .status(400)
          .json({ error: "User ID is required and must be a string" });
      }
      const { name, members } = req.body;
      // members: [{ user: userId, canCreateTask: boolean }, ...]
      const membersArr = Array.isArray(members) ? members : [];
      // Always ensure admin is included (will be handled in service as well)
      const team = await TeamService.createTeam({
        name,
        members: membersArr,
        adminId: userId,
      });
      res.status(201).json(team);
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  static async getTeamsForUser(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId || typeof userId !== "string") {
        return res
          .status(400)
          .json({ error: "User ID is required and must be a string" });
      }
      const teams = await TeamService.findTeamsForUser(userId);
      res.json(teams);
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  static async getTeamById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId || typeof userId !== "string") {
        return res
          .status(400)
          .json({ error: "User ID is required and must be a string" });
      }
      const team = await TeamService.findById(req.params.id);

      if (!team) return res.status(404).json({ error: "Team not found" });

      // Check membership
      const isMember =
        team.members.some((m: any) =>
          m.user?._id
            ? m.user._id.toString() === userId
            : m.user.toString() === userId
        ) ||
        (team.admin._id
          ? team.admin._id.toString() === userId
          : team.admin.toString() === userId);
      if (!isMember)
        return res
          .status(403)
          .json({ error: "Forbidden: You are not a member of this team." });

      res.json(team);
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  static async updateTeam(req: Request, res: Response) {
    try {
      const team = await TeamService.update(req.params.id, req.body);
      if (!team) return res.status(404).json({ error: "Team not found" });
      res.json(team);
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  static async deleteTeam(req: Request, res: Response) {
    try {
      const success = await (TeamService as any).delete(req.params.id);
      if (!success) return res.status(404).json({ error: "Team not found" });
      res.json({ message: "Team deleted" });
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  static async addMember(req: Request, res: Response) {
    try {
      const { userId, canCreateTask } = req.body;
      const team = await TeamService.addMember(req.params.id, userId, !!canCreateTask);
      if (!team) return res.status(404).json({ error: "Team not found" });
      res.json(team);
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  static async removeMember(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const team = await TeamService.removeMember(req.params.id, userId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      res.json(team);
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
}