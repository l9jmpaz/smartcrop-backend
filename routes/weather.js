import express from "express";
import axios from "axios";
import Weather from "../models/Weather.js";

const router = express.Router();

router.get("/sync", async (req, res) => {
  try {
    const city = "Manila";
    const apiKey = process.env.OPENWEATHER_KEY;
console.log("API Key:", process.env.OPENWEATHER_KEY);
console.log("City:", city);

    // ✅ FIX: Correct API URL syntax
    const url = 'https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric';
console.log("Request URL:", url);
    const { data } = await axios.get(url);

    // ✅ Validate data structure
    if (!data || !data.main) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid weather data received." });
    }

    // ✅ Create a new record
    const newWeather = new Weather({
      date: new Date(),
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain["1h"] || 0 : 0, // <-- Fixed ternary operator
    });

    await newWeather.save();

    res.json({
      success: true,
      message: "Weather synced successfully!",
      data: newWeather,
    });
  } catch (err) {
    console.error("🌧 Weather sync error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Server error",
    });
  }
});

export default router;