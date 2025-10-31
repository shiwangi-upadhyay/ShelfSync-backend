import { model, Schema, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "super_admin" | "project_owner" | "user" | "member" | "admin";
  teams: Types.ObjectId[];
  projects: Types.ObjectId[];
  memberType?: "dedicated" | "shared";
  activeProjectCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["super_admin", "project_owner", "user", "member", "admin"], default: "user" },
  teams: [{ type: Schema.Types.ObjectId, ref: "Team" }], // optional
  projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  memberType: {
    type: String, enum: ["dedicated", "shared"],
  },
  activeProjectCount: { type: Number, default: 0, min: 0, max: 2 },
}, { timestamps: true });

export default model<IUser>("User", userSchema);