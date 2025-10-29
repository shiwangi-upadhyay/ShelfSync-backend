import mongoose, { Schema } from 'mongoose'

export interface INotification extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    type: string;
    channel: string; // 'email' | 'inapp'
    data: any;
    status: string; // queued | sent | failed
    createdAt: string
}

const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    type: { type: String, required: true },
    channel: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    status: { type: String, default: 'queued' }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
})

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)