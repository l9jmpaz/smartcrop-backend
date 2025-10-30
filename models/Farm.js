import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fieldName: {
      type: String,
      required: [true, "Field name is required"],
      trim: true,
    },

    soilType: {
      type: String,
      enum: ["Clay", "Sandy", "Loam", "Silty", "Peaty", "Chalky"],
      default: "Clay",
    },

    wateringMethod: {
      type: String,
      enum: ["Sprinklers", "Drip", "Manual", "Flood", "Rainfed"],
      default: "Manual",
    },

    lastYearCrop: {
      type: String,
      default: "None",
    },

    fieldSize: {
      type: Number,
      default: 0,
    },

    // 🌾 FIX: this must be an array of objects, not strings
    tasks: [
      {
        date: String,
        type: String,
        crop: String,
        fieldName: String,
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    location: {
      latitude: Number,
      longitude: Number,
      barangay: String,
      city: String,
      province: String,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

farmSchema.index({ userId: 1 });

const Farm = mongoose.model("Farm", farmSchema);
export default Farm;