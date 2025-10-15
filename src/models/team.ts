import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name: string;
  admin: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  // name: { type: String, required: true },
  // admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  name: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model<ITeam>("Team", TeamSchema);