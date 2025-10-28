// backend/models/WeatherLog.js
import mongoose from "mongoose";

const weatherLogSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  rainfall: Number, // mm
  description: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("WeatherLog", weatherLogSchema);