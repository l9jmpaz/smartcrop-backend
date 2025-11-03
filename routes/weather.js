import express from "express";
import axios from "axios";
import Weather from "../models/Weather.js";

const router = express.Router();

// 🌤 Manual sync from OpenWeather
router.get("/sync", async (req, res) => {
  try {
    const city = "Manila";
    const apiKey =
      process.env.OPENWEATHER_KEY ||
      "5e79e7210cb543fea4a97220f8dbdd08";

    console.log("🌍 Fetching weather for:", city);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const { data } = await axios.get(url);

    if (!data || !data.main)
      return res
        .status(400)
        .json({ success: false, message: "Invalid weather data." });

    const newWeather = new Weather({
      date: new Date(),
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain["1h"] || 0 : 0,
    });

    await newWeather.save();
    res.json({
      success: true,
      message: "Weather synced successfully!",
      data: newWeather,
    });
  } catch (err) {
    console.error("🌧 Weather sync error:", err.message);
    res
      .status(500)
      .json({ success: false, error: err.message });
  }
});

// 💾 Save or update weather for a user (Flutter)
router.post("/save", async (req, res) => {
  try {
    const { userId, data } = req.body;
    if (!userId || !data)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const record = await Weather.findOneAndUpdate(
      { userId },
      { data, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Weather data saved!",
      data: record,
    });
  } catch (err) {
    console.error("💾 Save weather error:", err.message);
    res
      .status(500)
      .json({ success: false, message: err.message });
  }
});

router.get("/daily-update", async (req, res) => {
  try {
    const latitude = 14.5995;
    const longitude = 120.9842;

    // ✅ Working, simplified Open-Meteo API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation&timezone=Asia/Manila`;

    const { data } = await axios.get(url);

    
    if (!data || !data.current) {
      return res.status(400).json({
        success: false,
        message: "Invalid weather data from Open-Meteo",
        data,
      });
    }

    // ✅ Correct field names from Open-Meteo
    const { temperature_2m, relative_humidity_2m, precipitation } = data.current;

    const rainfall = precipitation ?? 0;

    // Check if today's weather record exists
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const existing = await Weather.findOne({ date: { $gte: startOfDay } });

    if (existing) {
      existing.temperature = temperature_2m; // ✅ fixed variable name
      existing.humidity = relative_humidity_2m;
      existing.rainfall = rainfall;
      existing.data = data;
      existing.updatedAt = new Date();
      await existing.save();
    } else {
      await Weather.create({
        temperature: temperature_2m,
        humidity: relative_humidity_2m,
        rainfall,
        data,
      });
    }

    res.json({
      success: true,
      message: "✅ Weather updated successfully from Open-Meteo (fixed variable name)",
      data: {
        temperature: temperature_2m,
        humidity: relative_humidity_2m,
        rainfall,
      },
    });
  } catch (err) {
    console.error("❌ Daily weather update failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


// 📊 Get all stored daily weather records (for Admin Dashboard)
router.get("/", async (req, res) => {
  try {
    const records = await Weather.find()
      .sort({ date: -1 })
      .limit(30);
    res.json({ success: true, data: records });
  } catch (err) {
    console.error("❌ Error fetching weather records:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
});

// 🧭 Get saved weather for a specific user (MUST BE LAST)
router.get("/:userId", async (req, res) => {
  try {
    const record = await Weather.findOne({
      userId: req.params.userId,
    }).sort({ updatedAt: -1 });
    if (!record)
      return res.status(404).json({
        success: false,
        message: "No weather data found",
      });

    res.json({ success: true, data: record.data });
  } catch (err) {
    console.error("❌ Fetch weather error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
});

export default router;