import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🌾 Basic Info
    farmName: { type: String, required: true, default: "Main Farm" },
    fieldName: { type: String, default: "" },
    farmSize: { type: String, default: "" },
    fieldSize: { type: String, default: "" }, // 👈 for CropScreen
    numFields: { type: String, default: "" },

    // 🌱 Crop Details
    soilType: { type: String, default: "" },
    wateringMethod: { type: String, default: "" }, // 👈 Added
    lastYearCrop: { type: String, default: "" },   // 👈 Added
    cropType: { type: String, default: "" },

    // 📍 Location (Optional)
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // 📊 Optional: yield tracking
    yields: [
      {
        year: Number,
        crop: String,
        totalYield: Number, // in kg or tons
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Farm", farmSchema);