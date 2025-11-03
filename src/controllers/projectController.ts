// projectController.ts
import { Request, Response } from "express";
import { ProjectService } from "../services/dbServices/projectService";
import mongoose from "mongoose";

export default class ProjectController {
    // Only Super Admin can create projects
    static async createProject(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || userRole !== "super_admin") {
                return res.status(403).json({
                    error: "Forbidden: Only Super Admin can create projects"
                });
            }

            const { name, description, department, projectOwner } = req.body;

            if (!name || !department || !projectOwner) {
                return res.status(400).json({
                    error: "Name, department, and project owner are required"
                });
            }

            const project = await ProjectService.createProject({
                name,
                description,
                department,
                projectOwner,
                createdBy: userId
            });

            res.status(201).json(project);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async getAllProjects(_req: Request, res: Response) {
        try {
            const projects = await ProjectService.findAll();
            res.json(projects);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getProjectById(req: Request, res: Response) {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid project ID" });
        }

        try {
            const project = await ProjectService.findById(id);

            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }

            res.json(project);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getProjectsByOwner(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const projects = await ProjectService.findByOwner(userId);
            res.json(projects);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getProjectsByDepartment(req: Request, res: Response) {
        const { departmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(departmentId)) {
            return res.status(400).json({ error: "Invalid department ID" });
        }

        try {
            const projects = await ProjectService.findByDepartment(departmentId);
            res.json(projects);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    // Only Super Admin or Project Owner can update
    static async updateProject(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const projectId = req.params.id;

            const project = await ProjectService.findById(projectId);

            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }

            const isOwner = project.projectOwner.toString() === userId;
            const isSuperAdmin = userRole === "super_admin";

            if (!isOwner && !isSuperAdmin) {
                return res.status(403).json({
                    error: "Forbidden: Only Project Owner or Super Admin can update"
                });
            }

            const updatedProject = await ProjectService.update(projectId, req.body);
            res.json(updatedProject);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    // Add member to project (Project Owner only)
    static async addMember(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const projectId = req.params.id;
            const { memberId, memberType } = req.body;

            if (!memberId || !memberType) {
                return res.status(400).json({
                    error: "Member ID and member type are required"
                });
            }

            if (!["dedicated", "shared"].includes(memberType)) {
                return res.status(400).json({
                    error: "Member type must be 'dedicated' or 'shared'"
                });
            }

            const project = await ProjectService.findById(projectId);

            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }

            const isOwner = project.projectOwner.toString() === userId;

            if (!isOwner) {
                return res.status(403).json({
                    error: "Forbidden: Only Project Owner can add members"
                });
            }

            const updatedProject = await ProjectService.addMember(
                projectId,
                memberId,
                memberType
            );

            res.json(updatedProject);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    // Remove member from project (Project Owner only)
    static async removeMember(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const projectId = req.params.id;
            const { memberId } = req.body;

            if (!memberId) {
                return res.status(400).json({ error: "Member ID is required" });
            }

            const project = await ProjectService.findById(projectId);

            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }

            const isOwner = project.projectOwner.toString() === userId;

            if (!isOwner) {
                return res.status(403).json({
                    error: "Forbidden: Only Project Owner can remove members"
                });
            }

            const updatedProject = await ProjectService.removeMember(
                projectId,
                memberId
            );

            res.json(updatedProject);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async deleteProject(req: Request, res: Response) {
        try {
            const userRole = req.user?.role;

            if (userRole !== "super_admin") {
                return res.status(403).json({
                    error: "Forbidden: Only Super Admin can delete projects"
                });
            }

            const success = await ProjectService.delete(req.params.id);

            if (!success) {
                return res.status(404).json({ error: "Project not found" });
            }

            res.json({ message: "Project deleted successfully" });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}
