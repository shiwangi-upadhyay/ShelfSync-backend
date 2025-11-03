import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Team from "../models/team";
import Task from "../models/task";
import { udpateUserSession } from "./sessionManager";
import Project from "../models/project";

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


// Require Super Admin Role
export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (!user || !user.userId) {
      console.error("[requireSuperAdmin] No user found");
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (user.role !== "super_admin") {
      console.warn(
        `[requireSuperAdmin] User ${user.userId} attempted super admin action with role: ${user.role}`
      );
      return res.status(403).json({
        error: "Forbidden: Super Admin access required",
      });
    }

    console.log(`[requireSuperAdmin] Super admin access granted to ${user.userId}`);
    next();
  } catch (error: any) {
    console.error("[requireSuperAdmin] error:", error);
    return res.status(500).json({ error: error?.message || "Server error" });
  }
}

// Example usage in your routes:
// app.get("/admin", requireAuth, requireRole("admin"), handler);
// app.get("/dashboard", requireAuth, handler);


// Require Project Owner role (or Super Admin)
export async function requireProjectOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      console.error("[requireProjectOwner] No user found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isProjectOwner = user.role === "project_owner";
    const isSuperAdmin = user.role === "super_admin";

    if (!isProjectOwner && !isSuperAdmin) {
      console.warn(
        `[requireProjectOwner] User ${user.userId} attempted project owner action with role: ${user.role}`
      );
      return res.status(403).json({
        error: "Forbidden: Project Owner or Super Admin access required",
      });
    }

    console.log(
      `[requireProjectOwner] Project owner access granted to ${user.userId}`
    );
    next();
  } catch (err: any) {
    console.error("[requireProjectOwner] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}


async function resolveProjectIdFromRequest(req: Request): Promise<string | null> {
  // Check params.projectId
  if (req.params?.projectId) {
    console.log(
      `[resolveProjectId] Found in params.projectId: ${req.params.projectId}`
    );
    return String(req.params.projectId);
  }

  // Check body.projectId
  if (req.body?.projectId) {
    console.log(`[resolveProjectId] Found in body.projectId: ${req.body.projectId}`);
    return String(req.body.projectId);
  }

  // Check if params.id is a project
  if (req.params?.id) {
    const possibleId = req.params.id;

    try {
      const project = await Project.findById(possibleId).select("_id").lean();
      if (project) {
        console.log(`[resolveProjectId] params.id is a project: ${possibleId}`);
        return String(project._id);
      }
    } catch (e) {
      // Not a project, try team or task
    }

    // Check if it's a team and get its project
    try {
      const team = await Team.findById(possibleId).select("project").lean();
      if (team && team.project) {
        console.log(
          `[resolveProjectId] params.id is a team, project: ${team.project}`
        );
        return String(team.project);
      }
    } catch (e) {
      // Not a team
    }

    // Check if it's a task and get its team's project
    try {
      const task = await Task.findById(possibleId).select("team").lean();
      if (task && task.team) {
        const team = await Team.findById(task.team).select("project").lean();
        if (team && team.project) {
          console.log(
            `[resolveProjectId] params.id is a task, project: ${team.project}`
          );
          return String(team.project);
        }
      }
    } catch (e) {
      // Not a task
    }
  }

  console.log("[resolveProjectId] Could not resolve projectId");
  return null;
}



/**
 * Require user to be the owner of the specific project (or Super Admin)
 */
export async function requireProjectOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      console.error("[requireProjectOwnership] No user found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Super Admin can access any project
    if (user.role === "super_admin") {
      console.log(
        `[requireProjectOwnership] Super admin bypass for ${user.userId}`
      );
      return next();
    }

    const projectId = await resolveProjectIdFromRequest(req);
    if (!projectId) {
      console.error("[requireProjectOwnership] Could not resolve projectId");
      return res.status(400).json({ error: "Missing project identifier" });
    }

    const project = await Project.findById(projectId)
      .populate("projectOwner")
      .lean();

    if (!project) {
      console.error(`[requireProjectOwnership] Project not found: ${projectId}`);
      return res.status(404).json({ error: "Project not found" });
    }

    const ownerId = String((project.projectOwner as any)?._id ?? project.projectOwner);
    const userId = String(user.userId);

    if (ownerId !== userId) {
      console.warn(
        `[requireProjectOwnership] User ${userId} is not owner of project ${projectId}`
      );
      return res.status(403).json({
        error: "Forbidden: Only the project owner can perform this action",
      });
    }

    console.log(
      `[requireProjectOwnership] Project ownership verified for ${userId}`
    );
    (req as any).project = project;
    next();
  } catch (err: any) {
    console.error("[requireProjectOwnership] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}



/**
 * Require user to be a member of the project (member, owner, or super admin)
 */
export async function requireProjectMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      console.error("[requireProjectMember] No user found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Super Admin can access any project
    if (user.role === "super_admin") {
      console.log(`[requireProjectMember] Super admin bypass for ${user.userId}`);
      return next();
    }

    const projectId = await resolveProjectIdFromRequest(req);
    if (!projectId) {
      console.error("[requireProjectMember] Could not resolve projectId");
      return res.status(400).json({ error: "Missing project identifier" });
    }

    const project = await Project.findById(projectId)
      .populate("projectOwner")
      .populate("members.user")
      .lean();

    if (!project) {
      console.error(`[requireProjectMember] Project not found: ${projectId}`);
      return res.status(404).json({ error: "Project not found" });
    }

    const userId = String(user.userId);
    const ownerId = String((project.projectOwner as any)?._id ?? project.projectOwner);

    const isOwner = ownerId === userId;
    const isMember = (project.members || []).some((m: any) => {
      const u = m?.user;
      const idStr = u && u._id ? String(u._id) : String(u);
      return idStr === userId;
    });

    if (!isOwner && !isMember) {
      console.warn(
        `[requireProjectMember] User ${userId} is not member of project ${projectId}`
      );
      return res.status(403).json({
        error: "Forbidden: You are not a member of this project",
      });
    }

    console.log(`[requireProjectMember] Project membership verified for ${userId}`);
    (req as any).project = project;
    next();
  } catch (err: any) {
    console.error("[requireProjectMember] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}


/**
 * Require user to be owner of department (Super Admin only)
 */
export async function requireDepartmentAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      console.error("[requireDepartmentAccess] No user found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.role !== "super_admin") {
      console.warn(
        `[requireDepartmentAccess] User ${user.userId} attempted department access with role: ${user.role}`
      );
      return res.status(403).json({
        error: "Forbidden: Super Admin access required for departments",
      });
    }

    console.log(
      `[requireDepartmentAccess] Department access granted to ${user.userId}`
    );
    next();
  } catch (err: any) {
    console.error("[requireDepartmentAccess] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

/**
 * Verify member request approval permission
 * Only the current project owner can approve/reject requests
 */
export async function requireMemberRequestApproval(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      console.error("[requireMemberRequestApproval] No user found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const requestId = req.params.id;
    if (!requestId) {
      console.error("[requireMemberRequestApproval] No request ID provided");
      return res.status(400).json({ error: "Request ID required" });
    }

    // Import MemberRequest model at the top of the file if not already
    const MemberRequest = require("../models/MemberRequest").default;

    const request = await MemberRequest.findById(requestId)
      .populate("currentProjectOwner")
      .lean();

    if (!request) {
      console.error(
        `[requireMemberRequestApproval] Request not found: ${requestId}`
      );
      return res.status(404).json({ error: "Member request not found" });
    }

    const currentOwnerId = String(
      (request.currentProjectOwner as any)?._id ?? request.currentProjectOwner
    );
    const userId = String(user.userId);

    if (currentOwnerId !== userId && user.role !== "super_admin") {
      console.warn(
        `[requireMemberRequestApproval] User ${userId} cannot approve request ${requestId}`
      );
      return res.status(403).json({
        error:
          "Forbidden: Only the current project owner can approve/reject this request",
      });
    }

    console.log(
      `[requireMemberRequestApproval] Approval permission verified for ${userId}`
    );
    (req as any).memberRequest = request;
    next();
  } catch (err: any) {
    console.error("[requireMemberRequestApproval] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}

/**
 * Combined middleware: Require either role or specific permission
 * Usage: requireEither([requireSuperAdmin, requireProjectOwnership])
 */
export function requireEither(middlewares: Function[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let lastError: any = null;

    for (const middleware of middlewares) {
      try {
        // Create mock response to test middleware
        let passed = false;
        const mockRes = {
          ...res,
          status: () => mockRes,
          json: () => {
            passed = false;
            return mockRes;
          },
        };

        const mockNext = () => {
          passed = true;
        };

        await middleware(req, mockRes, mockNext);

        if (passed) {
          console.log("[requireEither] Permission granted via one of the middlewares");
          return next();
        }
      } catch (err) {
        lastError = err;
      }
    }

    console.warn("[requireEither] All permission checks failed");
    return res.status(403).json({
      error: "Forbidden: Insufficient permissions",
      details: lastError?.message,
    });
  };
}