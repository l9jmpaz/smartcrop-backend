import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true },
  type: { type: String, required: true },     // Planting, Watering, Fertilizing, Harvesting
  crop: { type: String, required: true },
  date: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  kilos: { type: Number, default: 0 },
  fieldName: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);