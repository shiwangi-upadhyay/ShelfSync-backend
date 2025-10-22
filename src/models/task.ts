import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment {
  by: Types.ObjectId;
  text: string;
  date: Date;
}

export interface IRefFile {
  url: string;
  name: string;
  uploadedBy: Types.ObjectId;
  date: Date;
}

export interface IProgressField {
  title: string;
  value: string;
  by: Types.ObjectId;
  date: Date;
}

export interface ITask extends Document {
  team: Types.ObjectId;
  desc: string;
  topic: string;
  subTopic: string;
  startDate: Date;
  endDate: Date;
  priority: "low" | "medium" | "high";
  status: "not started" | "in progress" | "completed" | "closed";
  assignedTo: Types.ObjectId[];
  assignedBy: Types.ObjectId;
  comments: IComment[];
  refFiles: IRefFile[];
  progressFields: IProgressField[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  desc: { type: String, required: true },
  topic: { type: String },
  subTopic: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: {
    type: String,
    enum: ["not started", "in progress", "completed", "closed"],
    default: "not started"
  },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [{
  text: String,
  by: { type: Schema.Types.ObjectId, ref: "User" },
  date: Date
}],
progressFields: [{
  title: String,
  value: String,
  by: { type: Schema.Types.ObjectId, ref: "User" },
  date: Date
}],
refFiles: [{
  url: String,
  name: String,
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  date: Date
}]
}, { timestamps: true });

export default mongoose.model<ITask>("Task", TaskSchema);