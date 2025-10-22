import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeamMember {
  user: Types.ObjectId;
  canCreateTask: boolean;
}

export interface ITeam extends Document {
  name: string;
  admin: Types.ObjectId;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  canCreateTask: { type: Boolean, default: false }
}, { _id: false });

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: { type: [TeamMemberSchema], default: [] },
}, { timestamps: true });

export default mongoose.model<ITeam>("Team", TeamSchema);