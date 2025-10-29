import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import Notification from '../models/notification';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

interface EmailJobData {
    notificationId: string,
    email: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
}


const emailWorker = new Worker<EmailJobData>('email-notifications', async (job: Job<EmailJobData>) => {
    const { notificationId, email, title, message, metadata } = job.data;

    console.log(`Processing email job ${job.id} for ${email}`)

    try {
        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: title,
            html: message,
            ...metadata
        })


        // Update notification status
        await Notification.findByIdAndUpdate(notificationId, {
            status: 'sent',
            sentAt: new Date()
        })

        console.log(`Email sent successfully to ${email}`)

        return { success: true }
    } catch (error) {
        console.error(`Failed to send email to ${email}: `, error);

        // Update retry count
        await Notification.findByIdAndUpdate(notificationId, {
            $inc: { retryCount: 1 },
            status: job.attemptsMade >= (job.opts.attempts || 5) ? 'failed' : 'pending'
        })

        throw error
    }
}, {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    },
    limiter: {
        max: 100,
        duration: 60000 // 100 emails per minute
    },
    concurrency: 5
})

emailWorker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`)
})

emailWorker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err)
})


export default emailWorker