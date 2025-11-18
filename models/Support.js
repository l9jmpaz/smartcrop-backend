// backend/models/Support.js
import mongoose from "mongoose";

const SupportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },

  // MUST EXIST for admin reply
  adminReply: { type: String, default: "" },

  status: { type: String, default: "unread" },
  date: { type: Date, default: Date.now },

  repliedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Support", SupportSchema);