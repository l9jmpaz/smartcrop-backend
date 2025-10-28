import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  soilTypes: { type: [String], required: true },
  waterRequirement: { type: String, required: true },
  idealSeason: { type: String, required: true },
  oversupply: { type: Boolean, default: false },
  description: { type: String },
  minTemp: { type: Number, default: 0 },
  maxTemp: { type: Number, default: 40 }
}, { timestamps: true }); // adds createdAt and updatedAt

export default mongoose.model("Crop", cropSchema);
