import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskType: { type: String, required: true },
  crop: { type: String, required: true },
  date: { type: Date, required: true },
});

export default mongoose.model("Task", taskSchema);