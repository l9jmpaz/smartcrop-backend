import mongoose from "mongoose";

const yieldSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cropName: { type: String, required: true },
  quantity: { type: Number, required: true }, // in kg or tons
  field: { type: String },
  harvestDate: { type: Date, required: true },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model("Yield", yieldSchema);