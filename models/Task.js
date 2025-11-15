import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  fieldId: { type: mongoose.Schema.Types.ObjectId, ref: "Farm", required: true }, // ✅ ADD THIS

  taskType: { type: String, required: true },
  crop: { type: String, required: true },
  date: { type: Date, required: true },

  fieldName: { type: String, default: "Unknown Field" },
  completed: { type: Boolean, default: false }, // ✅ Add this so app works correctly

  kilos: { type: Number, default: 0 }, // harvest amount
});

export default mongoose.model("Task", taskSchema);