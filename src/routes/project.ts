
import express from "express";
import ProjectController from "../controllers/projectController";
import {
    requireAuth,
    requireSuperAdmin,
    requireProjectOwner,
    requireProjectOwnership,
    requireProjectMember,
} from "../middleware/auth";
import { validate } from "../middleware/validationMiddleware";

import { projectZod } from "../zod";

const router = express.Router();

// All project routes require authentication
router.use(requireAuth);

// Only Super Admin can create projects
router.post(
    "/projects",
    requireSuperAdmin,
    validate(projectZod.createProjectSchema),
    ProjectController.createProject
);

// Anyone authenticated can view all projects
router.get("/projects", ProjectController.getAllProjects);

// Project Owners can view their projects
router.get(
    "/projects/my-projects",
    requireProjectOwner,
    ProjectController.getProjectsByOwner
);

// View specific project (must be member or admin)
router.get(
    "/projects/:id",
    validate(projectZod.getProjectByIdSchema),
    requireProjectMember,
    ProjectController.getProjectById
);

// Only project owner or super admin can update
router.put(
    "/projects/:id",
    validate(projectZod.updateProjectSchema),
    requireProjectOwnership,
    ProjectController.updateProject
);

// Only project owner can add members
router.post(
    "/projects/:id/members",
    validate(projectZod.addMemberToProjectSchema),
    requireProjectOwnership,
    ProjectController.addMember
);

// Only project owner can remove members
router.delete(
    "/projects/:id/members",
    validate(projectZod.removeMemberFromProjectSchema),
    requireProjectOwnership,
    ProjectController.removeMember
);

// Only Super Admin can delete projects
router.delete(
    "/projects/:id",
    requireSuperAdmin,
    validate(projectZod.deleteProjectSchema),
    ProjectController.deleteProject
);

export default router;
