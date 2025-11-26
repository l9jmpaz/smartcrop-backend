import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  message: String,
  severity: String,
  affects: String,
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: String, default: "System" },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Alert", AlertSchema);