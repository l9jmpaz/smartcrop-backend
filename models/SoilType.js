import mongoose from "mongoose";

const SoilTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
});

export default mongoose.model("SoilType", SoilTypeSchema);