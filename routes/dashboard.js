// backend/routes/dashboard.js
import express from "express";
import fetch from "node-fetch"; // npm i node-fetch@2 (or use global fetch if supported)
import User from "../models/User.js";
import Farm from "../models/Farm.js"; // adjust name if different

const router = express.Router();

// GET /api/dashboard/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // get user
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // get farm / alerts - adjust query to your schema
    const farm = await Farm.findOne({ userId }).lean();

    // OpenWeather config (set in .env)
    const API_KEY = process.env.OPENWEATHER_KEY || "";
    // default lat/lon if farm missing
    const lat = farm?.location?.lat ?? 14.7;
    const lon = farm?.location?.lng ?? 121.0;

    let weather = null;
    if (API_KEY) {
      const wurl = 'https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}';
      const wres = await fetch(wurl);
      if (wres.ok) {
        const wjson = await wres.json();
        weather = {
          temp: Math.round(wjson.main.temp),
          description: wjson.weather?.[0]?.main || wjson.weather?.[0]?.description || "Clear",
          forecast: [], // you can call OneCall or forecast endpoint if you want multi-day
        };
      }
    }

    // basic alerts logic example (replace with your real logic)
    const alerts = [];
    if (farm?.cropType === "Rice") {
      alerts.push("Supply Alert: Rice oversupply detected. Consider alternative crops.");
    }

    // fallback if weather missing
    if (!weather) {
      weather = {
        temp: 28,
        description: "Partly Cloudy",
        forecast: [
          { day: "Mon", temp: "29°" },
          { day: "Tue", temp: "25°" },
          { day: "Wed", temp: "31°" },
          { day: "Thu", temp: "28°" },
        ],
      };
    }

    return res.json({
      success: true,
      user: { _id: user._id, username: user.username },
      farm,
      weather,
      alerts,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;