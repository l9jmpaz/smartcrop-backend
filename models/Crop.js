import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  soilTypes: [{ type: String, required: true }], // e.g. ["Loam", "Clay"]
  waterRequirement: { type: String, enum: ["low", "moderate", "high"], required: true },
  idealSeason: { type: String, enum: ["rainy", "dry"], required: true },
  oversupply: { type: Boolean, default: false },
  description: { type: String, default: "" }, // short info
  imageUrl: { type: String, default: "" }, // optional
}, { timestamps: true });

export default mongoose.model("Crop", cropSchema);