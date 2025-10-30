import express from "express";
import axios from "axios";
import Farm from "../models/Farm.js"; // ✅ import the Farm model
import Crop from "../models/Crop.js";

const router = express.Router();

router.get("/recommend/:userId", async (req, res) => {
  try {
    const farm = await Farm.findOne({ userId: req.params.userId });
    if (!farm)
      return res.status(404).json({ success: false, message: "No farm found for this user" });

    const { soilType } = farm;
    if (!soilType)
      return res.status(400).json({ success: false, message: "Farm has no soil type" });

    const city = "Tanauan City";
    const apiKey = process.env.OPENWEATHER_KEY;

    // 🧭 Get real-time weather
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    const weather = weatherRes.data;
    const temp = weather.main.temp;
    const condition = weather.weather[0].description;
    const month = new Date().getMonth() + 1;
    const season = month >= 6 && month <= 11 ? "rainy" : "dry";

    // 🌱 Get all suitable crops
    const crops = await Crop.find({
      soilTypes: { $in: [soilType] },
      idealSeason: season,
    });

    if (!crops.length)
      return res.json({ success: true, weather: { city, temp, condition }, data: [] });

    // 🧮 Calculate suitability based on temperature range
    const recommendations = crops.slice(0, 3).map((c) => {
      let suitability = 0;
      if (temp >= c.minTemp && temp <= c.maxTemp) suitability = 95;
      else if (temp >= c.minTemp - 2 && temp <= c.maxTemp + 2) suitability = 80;
      else suitability = 50;

      const untilMonth = month <= 6 ? "December 2025" : "May 2026";

      return {
        title: c.oversupply
          ? `${c.name} - Consider Alternative`
          : `${c.name} - Good Option`,
        color: c.oversupply ? "orange" : "green",
        details: [
          `Soil: Suitable for ${soilType} soil`,
          `Water: ${c.waterRequirement} requirement`,
          `Temperature: Ideal ${c.minTemp}°C - ${c.maxTemp}°C`,
          `Suitability Score: ${suitability}%`,
         `🌾 Best planted now — suitable until ${untilMonth}`,
        ],
        warning: c.oversupply
          ? `⚠ ${c.name} is currently oversupplied. Prices may drop.`
          : null,
      };
    });

    // 💬 Weather tip logic
    let weatherTip = "";
    if (condition.includes("rain") && season === "dry") {
      weatherTip = "Unexpected rain detected. Avoid overwatering and check for fungal risk.";
    } else if (condition.includes("clear") && season === "rainy") {
      weatherTip = "Dry spell in rainy season. Increase irrigation if soil moisture drops.";
    } else {
      weatherTip = "Weather conditions remain stable for current crops.";
    }

    res.json({
      success: true,
      weather: { city, temp, condition },
      weatherTip,
      data: recommendations,
    });
  } catch (err) {
    console.error("AI recommend error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;