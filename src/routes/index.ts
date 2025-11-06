import { Router } from "express";
import allRoute from "./allRoutes";

const router = Router();
router.use("/teams", allRoute.teamRoutes);
router.use("/user", allRoute.userRoutes);
router.use("/auth", allRoute.authRoutes);
router.use('/notification', allRoute.notificationRoutes);
router.use("/projects", allRoute.projectRoutes);
router.use("/department", allRoute.departmentRoutes)
router.use("/tasks", allRoute.taskRoutes);
router.use("/member-requests", allRoute.memberRequestRoutes);


export default router;

