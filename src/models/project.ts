import { model, Schema, Types } from "mongoose";

export interface IProjectMember {
    user: Types.ObjectId;
    memberType: "dedicated" | "shared";
    assignedDate: Date;
    projectCount?: number
}

export interface IProject extends Document {
    name: String;
    description?: String;
    department: Types.ObjectId;
    projectOwner: Types.ObjectId;
    members: IProjectMember[];
    teams: Types.ObjectId[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberType: {
        type: String,
        enum: ["dedicated", "shared"],
        required: true
    },
    assignedDate: { type: Date, default: Date.now },
    projectCount: { type: Number, default: 1, min: 1, max: 2 }
}, { _id: false })


const ProjectSchema = new Schema<IProject>({
    name: { type: String, required: true },
    description: { type: String },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    projectOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [ProjectMemberSchema], default: [] },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true })


export default model<IProject>("Project", ProjectSchema)