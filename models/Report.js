import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // e.g., Sept 2025
  farm: { type: String, default: "All farms" },
  status: { type: String, enum: ["Completed", "Pending"], default: "Completed" },
});

export default mongoose.model("Report", reportSchema);
