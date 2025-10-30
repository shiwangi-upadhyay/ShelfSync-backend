import { Router } from 'express'
import { NotificationController } from '../controllers/notificationController'
const router = Router()

router.post("/notifications/send", NotificationController.sendNotification);
router.get("/notification/:userId", NotificationController.getNotification)

export default router