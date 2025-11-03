// routes/departmentRoutes.ts
import express from "express";
import { requireAuth, requireSuperAdmin } from "../middleware/auth";
import { validate } from "../middleware/validationMiddleware";
import { departmentZod } from "../zod/index"
import { DepartmentController } from "../controllers/departController";

const router = express.Router();

// All department routes require authentication
router.use(requireAuth);

router.post(
    "/departments",
    requireSuperAdmin,
    validate(departmentZod.createDepartmentSchema),
    DepartmentController.createDepartment
);

router.get("/departments", DepartmentController.getAllDepartments);

router.get(
    "/departments/:id",
    validate(departmentZod.getDepartmentByIdSchema),
    DepartmentController.getDepartmentById
);

router.put(
    "/departments/:id",
    requireSuperAdmin,
    validate(departmentZod.updateDepartmentSchema),
    DepartmentController.updateDepartment
);

router.delete(
    "/departments/:id",
    requireSuperAdmin,
    validate(departmentZod.deleteDepartmentSchema),
    DepartmentController.deleteDepartment
);

export default router;
