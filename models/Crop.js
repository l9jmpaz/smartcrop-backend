// backend/models/CropLog.js
import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  farmer: { type: String, required: true },  // could link to user later
  crop: { type: String, required: true },
  yield: { type: Number, required: true },   // kg or tons
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Crop", cropSchema);