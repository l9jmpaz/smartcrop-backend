// backend/models/Support.js
import mongoose from "mongoose";

const supportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  status: { type: String, enum: ["unread", "resolved"], default: "unread" },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Support", supportSchema);