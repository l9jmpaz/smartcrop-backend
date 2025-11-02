import mongoose from "mongoose";

const taskSubSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // ✅ ensure ID exists
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true },
  crop: { type: String, default: "" },
  date: { type: Date, required: true },
  fieldName: { type: String },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});


const farmSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fieldName: { type: String, required: true, trim: true },
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
    lastYearCrop: { type: String, default: "None" },
    fieldSize: { type: Number, default: 0 },

    // ✅ Proper subdocument array
    tasks: { type: [taskSubSchema], default: [] },

    location: {
      latitude: Number,
      longitude: Number,
      barangay: String,
      city: String,
      province: String,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

farmSchema.index({ userId: 1 });

const Farm = mongoose.model("Farm", farmSchema);
export default Farm;