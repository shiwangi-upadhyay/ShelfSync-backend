import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./user";
import teamRoutes from "./team";
import taskRoutes from "./task";
import notificationRoutes from "./notification"

const router = Router();
router.use("/teams", teamRoutes);
router.use("/", userRoutes);
router.use("/", authRoutes);
router.use('/', notificationRoutes)

router.use("/tasks", taskRoutes);


export default router;

