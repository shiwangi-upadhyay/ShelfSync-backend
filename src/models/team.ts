import { Schema, Document, Types, model } from "mongoose";

export interface ITeamMember {
  user: Types.ObjectId;
  canCreateTask: boolean;
}

export interface ITeam extends Document {
  name: string;
  project: Types.ObjectId;
  admin: Types.ObjectId;
  members: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  canCreateTask: { type: Boolean, default: false }
}, { _id: false });

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: { type: [TeamMemberSchema], default: [] },
}, { timestamps: true });

export default model<ITeam>("Team", TeamSchema);