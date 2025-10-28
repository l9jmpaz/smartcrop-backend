import mongoose from "mongoose";
const schema = new mongoose.Schema({
  type: String,
  message: String,
  severity: { type: String, enum: ["info","warning","critical"], default: "info" },
  affects: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Alert", schema);
