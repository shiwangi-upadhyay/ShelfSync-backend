import dotenv from "dotenv";
import { Worker, Job } from 'bullmq'
import { Server } from 'socket.io'
import Notification from "../models/notification"
dotenv.config()

interface InAppJobData {
    notificationId: string,
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
}

let io: Server;

export const setSocketIo = (socketIO: Server) => {
    io = socketIO
}


const inAppWorker = new Worker<InAppJobData>('in-app-notifications', async (job: Job<InAppJobData>) => {
    const { notificationId, userId, title, message, metadata } = job.data

    console.log(`Processing in-app notification ${job.id} for user ${userId}`)

    try {
        // Emit notification via WebSocket
        if (io) {
            io.to(`user:${userId}`).emit('notification', {
                id: notificationId,
                title,
                message,
                metadata,
                createdAt: new Date()
            })
        }

        // Update notifications status
        await Notification.findByIdAndUpdate(notificationId, {
            status: 'sent',
            sentAt: new Date()
        })

        console.log(`In-app notification delivered to user ${userId}`);

        return { success: true }
    } catch (error) {
        console.error(`Failed to deliver in-app notification:`, error);

        await Notification.findByIdAndUpdate(notificationId, {
            $inc: { retryCount: 1 },
            status: job.attemptsMade >= (job.opts.attempts || 3) ? 'failed' : 'pending'
        })

        throw error
    }
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD

    },
    concurrency: 10
})

inAppWorker.on('completed', (job) => {
    console.log(`In-app notification job ${job.id} completed`)
})

inAppWorker.on('failed', (job, err) => {
    console.error(`In-app notification job ${job?.id} failed:`, err)
})

export default inAppWorker