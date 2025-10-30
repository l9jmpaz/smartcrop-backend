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
      required: false,
      default: 0,
    },

    // 🌍 Optional location coordinates (for weather API or mapping later)
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      barangay: { type: String },
      city: { type: String },
      province: { type: String },
    },

    tasks: [
      {
        date: String,
        type: String,
        crop: String,
        fieldName: String,
        completed: {type: Boolean, default: false},
        createdAt:{ type: Date, default: Date.now},
      },
    ],
    // 🧠 Future-proof attributes
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // ✅ Adds createdAt & updatedAt automatically
  }
);

// 🪶 Optional: create an index for faster queries by user
farmSchema.index({ userId: 1 });

const Farm = mongoose.model("Farm", farmSchema);

export default Farm;
