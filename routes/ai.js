import express from "express";
import axios from "axios";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Crop from "../models/Crop.js";

const router = express.Router();

router.get("/recommend/:userId", async (req, res) => {
  try {
    // 🔹 1. Get User
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // 🔹 2. Get Farm & Soil Type
    const farm = await Farm.findOne({ userId: req.params.userId });
    if (!farm)
      return res.json({
        success: true,
        message: "No farm found for this user.",
        data: [],
      });

    const soilType = farm.soilType;
    if (!soilType)
      return res.json({
        success: true,
        message: "Farm has no soilType set.",
        data: [],
      });

    // 🔹 3. Get Weather in Tanauan City
    const city = "Tanauan City";
    const apiKey = process.env.OPENWEATHER_KEY;
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const weather = weatherRes.data;
    const temp = weather.main.temp;
    const condition = weather.weather[0].description;
    const month = new Date().getMonth() + 1;
    const season = month >= 6 && month <= 11 ? "rainy" : "dry";

    // 🔹 4. Get Crops That Match Soil, Season, and Temperature
    let crops = await Crop.find({
      soilTypes: { $in: [soilType] },
      idealSeason: season,
      minTemp: { $lte: temp },
      maxTemp: { $gte: temp },
    });

    if (!crops.length) {
      return res.json({
        success: true,
        message: "No matching crops found for your soil, season, and temperature.",
        weather: { city, temp, condition },
        data: [],
      });
    }

    // 🔹 5. Compute Temperature Suitability Score (0–100%)
    crops = crops.map((c) => {
      const midRange = (c.minTemp + c.maxTemp) / 2;
      const deviation = Math.abs(temp - midRange);
      const idealRange = (c.maxTemp - c.minTemp) / 2;
      const suitability = Math.max(
        0,
        Math.min(100, 100 - (deviation / idealRange) * 50)
      );
      return { ...c.toObject(), suitability: Math.round(suitability) };
    });

    // 🔹 6. Sort by Best Suitability Score (Highest first)
    crops.sort((a, b) => b.suitability - a.suitability);

    // 🔹 7. Pick up to 3 crops (randomized slightly)
    const selected = crops.sort(() => 0.5 - Math.random()).slice(0, 3);

    // 🔹 8. Determine “Good Until” Date
    const untilMonth =
      season === "rainy"
        ? "December 2025"
        : "May 2026"; // 🌤 adjustable for your cycle

    // 🔹 9. Build Recommendations
    const recommendations = selected.map((c) => ({
      title: c.oversupply
        ? `${c.name} - Consider Alternative`
        : `${c.name} - Good Option`,
      color: c.oversupply ? "orange" : "green",
      details: [
        `Soil: Suitable for ${soilType} soil`,
        `Water: ${c.waterRequirement} requirement`,
        `Season: Ideal for ${season} months in Tanauan`,
        `Temperature: Ideal range ${c.minTemp}°C – ${c.maxTemp}°C`,
        `Suitability Score: ${c.suitability}%`,
       `🌾 Good until ${untilMonth}`,
      ],
      warning: c.oversupply
        ? `⚠ ${c.name} is currently oversupplied. Prices may drop.`
        : null,
    }));

    // 🔹 10. Generate Smart Weather Tip
    let weatherTip = "";
    if (condition.includes("rain") && season === "dry") {
      weatherTip =
        "Unexpected rain detected during dry season — reduce irrigation and check for possible fungus or root rot.";
    } else if (condition.includes("clear") && season === "rainy") {
      weatherTip =
        "Dry spell during rainy season — consider additional watering to maintain soil moisture.";
    } else if (temp > 33) {
      weatherTip =
        "High temperature detected — use mulching or shade nets to protect delicate crops.";
    } else if (temp < 20) {
      weatherTip =
        "Cooler than usual — ideal for leafy vegetables but avoid heat-loving crops.";
    } else {
      weatherTip = "Weather conditions remain stable and suitable for most crops.";
    }

    // 🔹 11. Send JSON Response
    res.json({
      success: true,
      weather: { city, temp, condition },
      weatherTip, // ✅ new
      data: recommendations,
    });
  } catch (err) {
    console.error("AI recommend error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;