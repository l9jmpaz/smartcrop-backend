import mongoose from "mongoose";

const weatherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  temperature: Number,
  humidity: Number,
  rainfall: Number,
  data: { type: Object }, // full JSON from OpenWeatherMap
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Weather", weatherSchema);