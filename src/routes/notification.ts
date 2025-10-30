import { Router } from 'express'
import { NotificationController } from '../controllers/notificationController'
import { requireAuth } from '../middleware/auth';
const router = Router()

router.post("/notifications/send", requireAuth, NotificationController.sendNotification);
router.get("/notification/:userId", requireAuth, NotificationController.getNotification)

export default router