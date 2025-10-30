import { Request, Response } from "express";
import NotificationService from "../services/NotificationService";
import Notification from "../models/notification";

export class NotificationController {
    static async sendNotification(req: Request, res: Response) {
        try {
            const { title, message, metadata } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }

            const notification = await NotificationService.sendNotification({
                userId,
                title,
                message,
                metadata
            })


            return res.json({ success: true, notification })
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }

    static async getNotification(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 20 } = req.query

            if (!userId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }

            const notifications = await Notification.find({ userId }).sort({ created: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

            return res.json({ success: true, notifications })
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }
}