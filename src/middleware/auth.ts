import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Team from "../models/team";

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

// Middleware to ensure the logged-in user is the team admin
export async function requireTeamAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("[requireTeamAdmin] Called for route:", req.originalUrl);
  console.log("[requireTeamAdmin] req.user:", req.user);
  console.log("[requireTeamAdmin] req.params:", req.params);

  // Try both param sources: req.params.id and req.body.teamId
  const teamId = req.params.id || req.body.teamId;
  console.log("[requireTeamAdmin] teamId resolved:", teamId);

  const team = await Team.findById(teamId);
  if (!team) {
    console.error("[requireTeamAdmin] Team not found for id:", teamId);
    return res.status(404).json({ error: "Team not found" });
  }
  console.log("[requireTeamAdmin] Team found:", team);

  if (team.admin.toString() !== req.user?.userId) {
    console.warn(
      "[requireTeamAdmin] User is not team admin. team.admin:",
      team.admin.toString(),
      "req.user.userId:",
      req.user?.userId
    );
    return res
      .status(403)
      .json({ error: "Only the team admin can perform this action" });
  }
  console.log("[requireTeamAdmin] User is team admin, proceeding.");
  next();
}

// Authenticate: Verifies JWT in cookies, attaches user to req
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log("[requireAuth] Called for route:", req.originalUrl);
  console.log("[requireAuth] Cookies received:", req.cookies);

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
    console.log("[requireAuth] JWT decoded, req.user set:", req.user);
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
