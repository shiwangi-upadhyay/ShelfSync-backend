import { Router } from 'express'
import { NotificationController } from '../controllers/notificationController'
import { requireAuth } from '../middleware/auth';
const router = Router()

router.post("/send", requireAuth, NotificationController.sendNotification);
router.get("/:userId", requireAuth, NotificationController.getNotification)

export default router