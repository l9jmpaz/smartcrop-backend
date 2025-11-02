import express from "express";
import axios from "axios";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Crop from "../models/Crop.js";

const router = express.Router();

// 🟢 Fetch oversupply crops
router.get("/oversupply", async (req, res) => {
  try {
    const crops = await Crop.find({ oversupply: true }).select("name");
    res.json({
      success: true,
      data: crops.map((c) => c.name),
    });
  } catch (err) {
    console.error("Oversupply fetch error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});

// 🧠 Main AI Recommendation Route
router.get("/recommend/:userId", async (req, res) => {
  try {
    // 🔹 1. Validate User
    const user = await User.findById(req.params.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "user_not_found" });

    // 🔹 2. Get Farms
    const farms = await Farm.find({ userId: req.params.userId });
    if (!farms.length)
      return res.json({
        success: true,
        message: "no_fields",
        data: [],
      });

    // 🔹 3. Weather
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

    const allCrops = await Crop.find({});
    const allFieldRecommendations = [];

    for (const farm of farms) {
      const soilType = (farm.soilType || "").toLowerCase();
      const fieldName = farm.fieldName || "unnamed_field";

      // Filter crops
      let matched = allCrops.filter((crop) => {
        const soilMatch = crop.soilTypes
          ?.map((s) => s.toLowerCase())
          .includes(soilType);
        const seasonMatch =
          (crop.idealSeason || "").toLowerCase() === season.toLowerCase();
        const tempMatch = crop.minTemp <= temp && crop.maxTemp >= temp;
        return soilMatch && seasonMatch && tempMatch;
      });

      // Broader fallback
      if (!matched.length) {
        matched = allCrops.filter((crop) =>
          crop.soilTypes?.map((s) => s.toLowerCase()).includes(soilType)
        );
      }

      // Random fallback
      if (!matched.length) {
        matched = allCrops.sort(() => 0.5 - Math.random()).slice(0, 3);
      }

      // Compute suitability
      matched = matched.map((c) => {
        const midRange = (c.minTemp + c.maxTemp) / 2;
        const deviation = Math.abs(temp - midRange);
        const idealRange = (c.maxTemp - c.minTemp) / 2;
        const suitability = Math.max(
          0,
          Math.min(100, 100 - (deviation / idealRange) * 50)
        );
        return { ...c.toObject(), suitability: Math.round(suitability) };
      });

      // Sort & top 3
      matched.sort((a, b) => b.suitability - a.suitability);
      const selected = matched.slice(0, 3);
      const untilMonth = season === "rainy" ? "december_2025" : "may_2026";

      const fieldRecommendations = selected.map((c) => ({
        title: c.oversupply
          ? `${c.name} - consider_alternative`
          : `${c.name} - good_option`,
        color: c.oversupply ? "orange" : "green",
        details: [
          `field_name:${fieldName}`,
          `soil_suitable:${farm.soilType}`,
          `water_req:${c.waterRequirement}`,
          `ideal_for:${season}:${city}`,
          `temp_range:${c.minTemp}:${c.maxTemp}`,
          `suitability:${c.suitability}`,
          `seed_type:${c.seedType}`,
          `good_until:${untilMonth}`,
        ],
        warning: c.oversupply ? "oversupply_warning" : null,
      }));

      allFieldRecommendations.push({
        fieldName,
        soilType: farm.soilType,
        recommendations: fieldRecommendations,
      });
    }

    // Weather Tip (using keys)
    let weatherTipKey = "weather_stable";

    if (condition.includes("rain") && season === "dry") {
      weatherTipKey = "unexpected_rain_dry";
    } else if (condition.includes("clear") && season === "rainy") {
      weatherTipKey = "dry_spell_rainy";
    } else if (temp > 33) {
      weatherTipKey = "high_temp_warning";
    } else if (temp < 20) {
      weatherTipKey = "cool_temp_advice";
    }

    res.json({
      success: true,
      weather: { city, temp, condition },
      weatherTip: weatherTipKey,
      data: allFieldRecommendations,
    });
  } catch (err) {
    console.error("❌ AI recommend error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});

export default router;