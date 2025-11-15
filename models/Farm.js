// models/Farm.js
import mongoose from "mongoose";

const taskSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  type: String,
  crop: String,
  date: Date,
  fieldName: String,
  completed: { type: Boolean, default: false },
  kilos: { type: Number, default: 0 }
});

const farmSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    fieldName: { type: String, required: true, trim: true },
    soilType: { type: String, default: "Clay" },
    wateringMethod: { type: String, default: "Manual" },

    // ✔ KEEP lastYearCrop (option B)
    lastYearCrop: { type: String, default: "" },

    fieldSize: { type: Number, default: 0 },

    // Location
    location: {
      latitude: Number,
      longitude: Number,
    },

    // AI-related
    selectedCrop: { type: String, default: null },
    aiRecommendations: { type: [String], default: [] },

    plantedDate: { type: Date, default: null },
    harvestDate: { type: Date, default: null },

    // ✔ BEST OPTION — archive completed field + keep history
    archived: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    // All calendar tasks
    tasks: { type: [taskSubSchema], default: [] },
  },
  { timestamps: true }
);

farmSchema.index({ userId: 1 });

const Farm = mongoose.model("Farm", farmSchema);
export default Farm;