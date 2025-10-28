import express from "express";
import axios from "axios";
import Weather from "../models/Weather.js";

const router = express.Router();

// 🌤 Sync (manual update from OpenWeather)
router.get("/sync", async (req, res) => {
  try {
    const city = "Manila";
    const apiKey = process.env.OPENWEATHER_KEY || "5e79e7210cb543fea4a97220f8dbdd08";

    console.log("🌍 Fetching weather for:", city);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const { data } = await axios.get(url);

    if (!data || !data.main) {
      return res.status(400).json({ success: false, message: "Invalid weather data." });
    }

    const newWeather = new Weather({
      date: new Date(),
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain["1h"] || 0 : 0,
    });

    await newWeather.save();
    res.json({ success: true, message: "Weather synced successfully!", data: newWeather });
  } catch (err) {
    console.error("🌧 Weather sync error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// 🧭 Get saved weather for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const record = await Weather.findOne({ userId: req.params.userId }).sort({ updatedAt: -1 });
    if (!record) return res.status(404).json({ success: false, message: "No weather data found" });

    res.json({ success: true, data: record.data });
  } catch (err) {
    console.error("❌ Fetch weather error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// 💾 Save or update weather for a user
router.post("/save", async (req, res) => {
  try {
    const { userId, data } = req.body;
    if (!userId || !data) return res.status(400).json({ success: false, message: "Missing required fields" });

    const record = await Weather.findOneAndUpdate(
      { userId },
      { data, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Weather data saved!", data: record });
  } catch (err) {
    console.error("💾 Save weather error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;