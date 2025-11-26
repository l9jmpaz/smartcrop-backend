import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  message: { type: String, required: true },
  severity: { type: String, default: "Critical" }, // Critical, Warning, Info
  affects: { type: String, default: "System" },
  timestamp: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false }
});

export default mongoose.model("Alert", AlertSchema);