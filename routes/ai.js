// routes/aiRoutes.js
import express from "express";
import User from "../models/User.js";
import Crop from "../models/Crop.js";
import axios from "axios";

const router = express.Router();

router.get("/recommend/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const { soilType } = user;
    const city = "Tanauan City";
    const apiKey = process.env.OPENWEATHER_KEY;

    // 🧠 get live weather
    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const weather = weatherRes.data;
    const temp = weather.main.temp;
    const condition = weather.weather[0].description;

    // 🗓 determine season
    const month = new Date().getMonth() + 1;
    const season = month >= 6 && month <= 11 ? "rainy" : "dry";

    console.log("🧩 User soilType:", soilType);
    console.log("🗓 Season:", season);

    // ✅ fallback if soilType missing
    if (!soilType) {
      return res.json({
        success: true,
        message: "User has no soilType set.",
        weather: { city, temp, condition },
        data: [],
      });
    }

    // ✅ get matching crops
    const crops = await Crop.find({
      soilTypes: { $in: [soilType] },
      idealSeason: season,
    });

    console.log(`🌱 Found ${crops.length} matching crops for ${soilType} (${season})`);

    if (!crops.length) {
      return res.json({
        success: true,
        message: "No matching crops found for your soil and season.",
        weather: { city, temp, condition },
        data: [],
      });
    }

    // ✅ build recommendation cards
    const recommendations = crops.map((c) => ({
      title: c.oversupply
        ? `${c.name} - Consider Alternative`
        : `${c.name} - Good Option`,
      color: c.oversupply ? "orange" : "green",
      details: [
        `Soil: Suitable for ${soilType} soil`,
        `Water: ${c.waterRequirement} requirement`,
        `Season: Ideal for ${season} months in Tanauan`,
      ],
      warning: c.oversupply
        ? `⚠ ${c.name} is currently oversupplied. Prices may drop.`
        : null,
    }));

    res.json({
      success: true,
      weather: { city, temp, condition },
      data: recommendations,
    });
  } catch (err) {
    console.error("❌ AI recommend error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

export default router;