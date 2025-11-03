import { Request, Response } from "express";
import Department from "../models/department";
import { DepartmentService } from "../services/dbServices/departmentServices";

export class DepartmentController {
    static async createDepartment(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || userRole !== "super_admin") {
                return res.status(403).json({ error: "Forbidden: Only Super Admin can create departments" })
            }

            const { name, description } = req.body;

            const department = await DepartmentService.createDepartment({
                name,
                description,
                createdBy: userId
            });

            res.status(201).json(department);
        } catch (error: any) {
            res.status(500).json({ message: "Department creation failed. Please try again later" });
        }
    }

    static async getAllDepartments(_req: Request, res: Response) {
        try {
            const departments = await DepartmentService.findAll();
            res.json(departments);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    static async getDepartmentById(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const department = await DepartmentService.findById(id);
            if (!department) {
                return res.status(404).json({ error: "Department not found" });
            }
            res.json(department);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }


    static async updateDepartment(req: Request, res: Response) {
        try {
            const userRole = req.user?.role;

            if (userRole !== "super_admin") {
                return res.status(403).json({
                    error: "Forbidden: Only Super Admin can update departments"
                });
            }

            const department = await DepartmentService.update(
                req.params.id,
                req.body
            );

            if (!department) {
                return res.status(404).json({ error: "Department not found" });
            }

            res.json(department);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async deleteDepartment(req: Request, res: Response) {
        try {
            const userRole = req.user?.role;

            if (userRole !== "super_admin") {
                return res.status(403).json({
                    error: "Forbidden: Only Super Admin can delete departments"
                });
            }

            const success = await DepartmentService.delete(req.params.id);

            if (!success) {
                return res.status(404).json({ error: "Department not found" });
            }

            res.json({ message: "Department deleted successfully" });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}