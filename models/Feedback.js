import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Feedback", schema);
