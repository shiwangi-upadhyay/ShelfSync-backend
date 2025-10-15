import { Request, Response } from "express";
import { TeamService } from "../services/dbServices/teamService";

export default class TeamController {
  static async createTeam(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId || typeof userId !== "string") {
        console.error("[TeamController] Missing or invalid userId:", userId);
        return res
          .status(400)
          .json({ error: "User ID is required and must be a string" });
      }
      console.log("[TeamController] req.body:", JSON.stringify(req.body, null, 2));
      const { name, memberIds, members } = req.body;
      const memberIdsFinal = Array.from(
        new Set([userId, ...(memberIds ?? members ?? [])])
      );
      console.log("[TeamController] memberIds to be saved:", memberIdsFinal);
      const team = await TeamService.createTeam({
        name,
        memberIds: memberIdsFinal,
        adminId: userId,
      });
      console.log("[TeamController] Team after creation (populated):", team);
      res.status(201).json(team);
    } catch (err) {
      console.error("[TeamController] Error creating team:", err);
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
      console.log("[Controller] Team fetched by ID:", team);

      if (!team) return res.status(404).json({ error: "Team not found" });

      // Check membership
      const isMember =
        team.members.some((m: any) => m._id.toString() === userId) ||
        team.admin._id.toString() === userId;
      if (!isMember)
        return res
          .status(403)
          .json({ error: "Forbidden: You are not a member of this team." });

      res.json(team);
    } catch (err) {
      console.log("[Controller] Error fetching team by ID:", err);
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
      const success = await TeamService.delete(req.params.id);
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
      const { userId } = req.body;
      const team = await TeamService.addMember(req.params.id, userId);
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
