import dotenv from "dotenv";
import { Queue } from 'bullmq'
import User from '../models/user';
import Notification from "../models/notification"
import { Types } from 'mongoose';
import { EmailTemplates } from "../views/emailTemplates";
dotenv.config();


const emailQueue = new Queue('email-notifications', {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    }
});

const inAppQueue = new Queue('in-app-notifications', {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
    }
})


interface NotificationPayload {
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
}


export class NotificationServices {

    async sendNotification(payload: NotificationPayload) {
        const { userId, title, message, metadata } = payload;

        // Check if user is logged in 
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('user not found')
        }

        const isLoggedIn = await this.checkUserLoginStatus(userId);

        if (isLoggedIn) {
            // Send in-app notification
            return await this.sendInAppNotification(user, title, message, metadata)
        } else {
            // Send email notification
            return await this.sendEmailNotification(user, title, message, metadata)
        }
    }

    private async checkUserLoginStatus(userId: string): Promise<boolean> {
        // Check if user has active session in Redis
        const redis = await emailQueue.client;
        const sessionKey = `user:session:${userId}`;
        const session = await redis.get(sessionKey);
        console.log("session", session)

        return !!session
    }

    private async sendInAppNotification(user: any, title: string, message: string, metadata?: Record<string, any>) {
        // Save to mongodb
        const notification = await Notification.create({
            userId: user._id,
            type: 'in_app',
            title,
            message,
            metadata,
            status: 'pending'
        }) as { _id: Types.ObjectId }

        // Add to queue for real-time delivery
        await inAppQueue.add('deliver-in-app', {
            notificationId: notification._id.toString(),
            userId: user._id.toString(),
            title,
            message,
            metadata
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: true
        })

        return notification
    }

    private async sendEmailNotification(user: any, title: string, message: string, metadata?: Record<string, any>) {

        const priorityMap: Record<string, number> = {
            high: 1,
            medium: 5,
            low: 10
        };

        let subject = title;
        let html = message;


        // Generate HTML from templates if applicable
        switch (metadata?.type) {
            case "task_assignment":
                const assign = EmailTemplates.taskAssigned({
                    name: user.name,
                    assignedBy: metadata.assignedBy,
                    desc: metadata.taskDesc,
                    teamName: metadata.teamName,
                    startDate: metadata.startDate,
                    endDate: metadata.endDate,
                    priority: metadata.priority,
                });
                subject = assign.subject;
                html = assign.html;
                break;

            case "task_completed":
                const completed = EmailTemplates.taskCompleted({
                    name: user.name,
                    completedBy: metadata.completedBy,
                    desc: metadata.taskDesc,
                    teamName: metadata.teamName,
                });
                subject = completed.subject;
                html = completed.html;
                break;
        }


        console.log("metadata:", metadata)
        // save to MongoDb
        const notification = await Notification.create({
            userId: user._id,
            type: 'email',
            title,
            message,
            metadata,
            status: 'pending'
        }) as { _id: Types.ObjectId }

        // add to email queue
        await emailQueue.add('send-email', {
            notificationId: notification._id.toString(),
            email: user.email,
            title: subject,
            message: html,
            metadata
        }, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 5000
            },
            priority: priorityMap[metadata?.priority] ?? 5
        })

        return notification
    }

    // Bulk notification method
    async sendBulkNotifications(userIds: string[], title: string, message: string) {
        const notifications = [];

        for (const userId of userIds) {
            const notification = await this.sendNotification({
                userId,
                title,
                message
            });

            notifications.push(notification)
        }

        return notifications
    }
}

export default new NotificationServices()