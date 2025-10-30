import express from "express";
import axios from "axios";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Crop from "../models/Crop.js";

const router = express.Router();

router.get("/recommend/:userId", async (req, res) => {
  try {
    // 1️⃣ Get user and farm
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const farm = await Farm.findOne({ userId: req.params.userId });
    if (!farm)
      return res.json({ success: true, message: "No farm found for this user", data: [] });

    const soilType = farm.soilType;
    if (!soilType)
      return res.json({ success: true, message: "Farm has no soil type set", data: [] });

    // 2️⃣ Get current weather from OpenWeather
    const city = "Tanauan City";
    const apiKey = process.env.OPENWEATHER_KEY;

    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    const weather = weatherRes.data;
    const temp = weather.main.temp;
    const condition = weather.weather[0].description;
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const season = month >= 6 && month <= 11 ? "rainy" : "dry";

    // 3️⃣ Determine "good until" date
    const goodUntil =
      season === "rainy"
        ? new Date(year, 11, 30) // until December
        : new Date(year, 4, 31); // until May

    // 4️⃣ Detect weather shift
    let weatherTip = "";
    if (season === "dry" && condition.includes("rain")) {
      weatherTip =
        "Unexpected rain detected during dry season. Avoid overwatering and check for fungal risks.";
    } else if (season === "rainy" && (condition.includes("sun") || temp > 32)) {
      weatherTip =
        "Unusual heat during rainy season. Ensure proper irrigation and mulch to retain soil moisture.";
    } else if (temp < 18 && season === "dry") {
      weatherTip =
        "Cooler temperatures than usual. Choose temperature-tolerant crops like cabbage or carrot.";
    } else if (temp > 35 && season === "rainy") {
      weatherTip =
        "Temperature spike detected. Delay planting sensitive crops or use shade net protection.";
    } else {
      weatherTip = "Weather conditions remain stable for your region. Continue regular farm routines.";
    }

    // 5️⃣ Primary filtering logic
    let crops = await Crop.find({
      soilTypes: { $in: [soilType] },
      idealSeason: season,
      minTemp: { $lte: temp },
      maxTemp: { $gte: temp },
    });

    // 6️⃣ Smart fallback
    if (crops.length < 3) {
      const tempRange = 3;
      const fallback = await Crop.find({
        soilTypes: { $in: [soilType] },
        idealSeason: season,
        minTemp: { $lte: temp + tempRange },
        maxTemp: { $gte: temp - tempRange },
      });
      const ids = new Set(crops.map((c) => c._id.toString()));
      fallback.forEach((c) => {
        if (!ids.has(c._id.toString())) crops.push(c);
      });
    }

    // 7️⃣ Add suitability score
    crops = crops.map((c) => {
      const mid = (c.minTemp + c.maxTemp) / 2;
      const diff = Math.abs(temp - mid);
      const range = (c.maxTemp - c.minTemp) / 2;
      const suitability = Math.max(0, Math.min(100, 100 - (diff / range) * 50));
      return { ...c.toObject(), suitability: Math.round(suitability) };
    });

    crops.sort((a, b) => b.suitability - a.suitability);
    const topCrops = crops.slice(0, 3);

    // 8️⃣ Build recommendations
    const recommendations = topCrops.map((c) => ({
      title: c.oversupply
        ? `${c.name} - Consider Alternative`
        : `${c.name} - Good Option`,
      color: c.oversupply ? "orange" : "green",
      details: [
        `Soil: Suitable for ${soilType} soil`,
        `Water: ${c.waterRequirement} requirement`,
        `Seed Type: ${c.seedType}`,
        `Season: Ideal for ${season} months in Tanauan`,
        `Temperature: Ideal range ${c.minTemp}°C – ${c.maxTemp}°C`,
        `Suitability Score: ${c.suitability}%`,
        `🌦️ Best planted now — suitable until ${goodUntil.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        })}`,
      ],
      warning: c.oversupply
        ? `⚠ ${c.name} is currently oversupplied. Prices may drop.`
        : null,
    }));

    // 9️⃣ Final response
    res.json({
      success: true,
      weather: { city, temp, condition, season },
      weatherTip,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (err) {
    console.error("AI recommend error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;