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
    "/",
    requireSuperAdmin,
    validate(departmentZod.createDepartmentSchema),
    DepartmentController.createDepartment
);

router.get("/", DepartmentController.getAllDepartments);

router.get(
    "/:id",
    validate(departmentZod.getDepartmentByIdSchema),
    DepartmentController.getDepartmentById
);

router.put(
    "/:id",
    requireSuperAdmin,
    validate(departmentZod.updateDepartmentSchema),
    DepartmentController.updateDepartment
);

router.delete(
    "/:id",
    requireSuperAdmin,
    validate(departmentZod.deleteDepartmentSchema),
    DepartmentController.deleteDepartment
);

export default router;
