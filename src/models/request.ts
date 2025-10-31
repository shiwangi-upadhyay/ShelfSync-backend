import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMemberRequest extends Document {
    requestingProject: Types.ObjectId;
    requestingProjectOwner: Types.ObjectId;
    requestedMember: Types.ObjectId;
    currentProject: Types.ObjectId; // Member's current project
    currentProjectOwner: Types.ObjectId;
    requestType: "dedicated" | "shared";
    reason?: string;
    status: "pending" | "approved" | "rejected";
    approvedBy?: Types.ObjectId;
    approvalDate?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MemberRequestSchema = new Schema<IMemberRequest>({
    requestingProject: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    requestingProjectOwner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    requestedMember: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    currentProject: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    currentProjectOwner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    requestType: {
        type: String,
        enum: ["dedicated", "shared"],
        required: true
    },
    reason: { type: String },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvalDate: { type: Date },
    rejectionReason: { type: String }
}, { timestamps: true });

export default mongoose.model<IMemberRequest>("MemberRequest", MemberRequestSchema);
