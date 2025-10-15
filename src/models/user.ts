import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }], // optional
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);