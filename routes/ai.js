import express from "express";
import axios from "axios";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Crop from "../models/Crop.js";

const router = express.Router();

router.get("/recommend/:userId", async (req, res) => {
  try {
    // 🧠 1️⃣ Find user
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🧠 2️⃣ Find farm linked to this user
    const farm = await Farm.findOne({ userId: req.params.userId });
    if (!farm) {
      return res.json({
        success: true,
        message: "No farm found for this user.",
        weather: { city: "Tanauan City", temp: 0, condition: "" },
        data: [],
      });
    }

    const soilType = farm.soilType;
    if (!soilType) {
      return res.json({
        success: true,
        message: "Farm has no soilType set.",
        weather: { city: "Tanauan City", temp: 0, condition: "" },
        data: [],
      });
    }

    // 🌦️ 3️⃣ Get weather and determine season
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

    // 🌱 4️⃣ Get matching crops from DB
    const crops = await Crop.find({
      soilTypes: { $in: [soilType] },
      idealSeason: season,
    });

    if (!crops.length) {
      return res.json({
        success: true,
        message: "No matching crops found for your soil and season.",
        weather: { city, temp, condition },
        data: [],
      });
    }

    // 🧮 5️⃣ Build recommendations
    const recommendations = crops.map((c) => ({
      title: c.oversupply
        ?`${c.name} - Consider Alternative`
        :`${c.name} - Good Option`,
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

    // ✅ 6️⃣ Send back result
    res.json({
      success: true,
      weather: { city, temp, condition },
      data: recommendations,
    });
  } catch (err) {
    console.error("AI recommend error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;