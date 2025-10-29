import mongoose, { Schema } from 'mongoose'

export interface INotification extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    type: "email" | "in_app";
    title: string;
    message: string;
    read: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    sentAt?: Date;
    status: 'pending' | 'sent' | 'failed';
    retryCount: number;
}

const NotificationSchema = new Schema<INotification>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['email', 'in_app'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    retryCount: { type: Number, default: 0 }
});

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, createdAt: 1 })

export default mongoose.model<INotification>('Notification', NotificationSchema);