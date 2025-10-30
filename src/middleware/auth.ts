import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Team from "../models/team";
import Task from "../models/task";
import { udpateUserSession } from "./sessionManager";

// Augment Express Request type to include 'user'
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
// Middleware to ensure the logged-in user is team admin OR has canCreateTask permission
export async function requireCanCreateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Try explicit teamId first
    let teamId: string | undefined = req.body?.teamId;

    // If missing and params.id exists, treat params.id as a task id and resolve its team
    if (!teamId && req.params?.id) {
      const possibleTaskId = req.params.id;
      const task = await Task.findById(possibleTaskId).select("team").lean();
      if (task && task.team) teamId = String(task.team);
    }

    if (!teamId) {
      console.error("[requireCanCreateTask] Could not resolve teamId");
      return res.status(400).json({ error: "Missing team identifier" });
    }

    const team = await Team.findById(teamId).populate("admin").populate("members.user");
    if (!team) {
      console.error("[requireCanCreateTask] Team not found:", teamId);
      return res.status(404).json({ error: "Team not found" });
    }

    // Normalize admin id (team.admin might be populated or just an id)
    const adminId = String((team.admin as any)?._id ?? team.admin);

    const isAdmin = adminId === String(userId);
    const canCreate = isAdmin || (team.members || []).some((m: any) => {
      const u = m?.user;
      const idStr = (u && u._id) ? String(u._id) : String(u);
      return idStr === String(userId) && !!m.canCreateTask;
    });

    if (!canCreate) {
      console.warn("[requireCanCreateTask] Permission denied for user:", userId, "team:", teamId);
      return res.status(403).json({ error: "Only the team admin or a member with canCreateTask permission can perform this action" });
    }

    (req as any).team = team; // attach for downstream if needed
    next();
  } catch (err: any) {
    console.error("[requireCanCreateTask] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
// Authenticate: Verifies JWT in cookies, attaches user to req
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Allow CORS preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }



  const token = req.cookies.authToken;
  if (!token) {
    console.error("[requireAuth] No auth token found!");
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };
    req.user = decoded;

    // Refresh Session in Redis
    await udpateUserSession(decoded.userId, {
      userId: decoded.userId,
      email: decoded.email,
      lastActivity: new Date().toISOString(),
      token: token
    });

    next();
  } catch (err) {
    console.error("[requireAuth] JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}
// Authorize: Checks if user has the required role
export function requireRole(role: string) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

// Example usage in your routes:
// app.get("/admin", requireAuth, requireRole("admin"), handler);
// app.get("/dashboard", requireAuth, handler);
