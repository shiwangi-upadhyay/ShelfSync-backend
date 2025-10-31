import { Document, model, Schema, Types } from "mongoose";

export interface IDepartment extends Document {
    name: string;
    description?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true })

export default model<IDepartment>('Department', DepartmentSchema)