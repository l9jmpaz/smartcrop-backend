import express from "express";
import axios from "axios";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import Crop from "../models/Crop.js";

const router = express.Router();

/* =========================================================
   🟢 FETCH OVERSUPPLY CROPS
========================================================= */
router.get("/oversupply", async (req, res) => {
  try {
    const crops = await Crop.find({ oversupply: true }).select("name");
    res.json({
      success: true,
      crops: crops.map((c) => c.name),
    });
  } catch (err) {
    console.error("Oversupply fetch error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});

/* =========================================================
   🟡 UPDATE OVERSUPPLY CROPS
========================================================= */
router.put("/oversupply", async (req, res) => {
  try {
    const { crops } = req.body;

    if (!Array.isArray(crops))
      return res.status(400).json({
        success: false,
        message: "crops_must_be_array"
      });

    await Crop.updateMany({}, { oversupply: false });
    await Crop.updateMany({ name: { $in: crops } }, { oversupply: true });

    res.json({ success: true, message: "oversupply_updated", crops });
  } catch (err) {
    console.error("Oversupply update error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});


/* =========================================================
   🧠 MAIN AI RECOMMENDATION ROUTE
========================================================= */

router.get("/recommend/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    /* ---------------- CHECK USER ---------------- */
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "user_not_found" });

    /* ---------------- FETCH FARMS ---------------- */
    const farms = await Farm.find({ userId, archived: false });

    if (farms.length === 0) {
      return res.json({
        success: true,
        message: "no_fields",
        data: [],
        weather: { city: "Tanauan City", temp: 30, condition: "clear" },
        weatherTip: "weather_stable"
      });
    }

    /* ---------------- WEATHER ---------------- */
    const city = "Tanauan City";
    const apiKey = process.env.OPENWEATHER_KEY;

    let temp = 30;
    let condition = "clear";

    try {
      const w = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      temp = w.data.main.temp;
      condition = w.data.weather[0].description;
    } catch {
      console.log("⚠️ Weather API failed. Using fallback.");
    }

    const month = new Date().getMonth() + 1;
    const season = month >= 6 && month <= 11 ? "rainy" : "dry";

    /* ---------------- FETCH ALL CROPS ---------------- */
    const allCrops = await Crop.find({});
    const output = [];

    /* =========================================================
       LOOP EACH FIELD
    ========================================================== */

    for (const farm of farms) {

      // If field already locked (user selected crop)
      if (farm.selectedCrop && farm.aiRecommendations?.length > 0) {
        output.push({
          fieldId: farm._id,
          fieldName: farm.fieldName,
          soilType: farm.soilType,
          recommendations: farm.aiRecommendations,
          locked: true
        });
        continue;
      }

      const soil = (farm.soilType || "").toLowerCase();

      /* ------------- FILTERING CROPS ------------- */
      let matched = allCrops.filter(crop => {
        const soilMatch = crop.soilTypes?.map(s => s.toLowerCase()).includes(soil);
        const seasonMatch = crop.idealSeason?.toLowerCase() === season;
        const tempMatch = crop.minTemp <= temp && crop.maxTemp >= temp;
        return soilMatch && seasonMatch && tempMatch;
      });

      if (matched.length === 0) {
        matched = allCrops.filter(crop =>
          crop.soilTypes?.map(s => s.toLowerCase()).includes(soil)
        );
      }

      if (matched.length === 0) {
        matched = allCrops.sort(() => 0.5 - Math.random()).slice(0, 3);
      }

      /* ------------- SUITABILITY SCORE ------------- */
      matched = matched.map(c => {
        const mid = (c.minTemp + c.maxTemp) / 2;
        const deviation = Math.abs(temp - mid);
        const idealRange = (c.maxTemp - c.minTemp) / 2;
        const suitability = Math.max(0, Math.min(100, 100 - (deviation / idealRange) * 50));
        return { ...c.toObject(), suitability: Math.round(suitability) };
      });

      matched.sort((a, b) => b.suitability - a.suitability);

      const selected = matched.slice(0, 3);

      /* ------------- FIXED untilMonth HERE ------------- */
      const untilMonth =
        season === "rainy"
          ? "December 2025"
          : "May 2026";

      /* ------------- BUILD RECOMMENDATION LIST ------------- */
      const recs = selected.map(c => ({
        crop: c.name,
        title: c.oversupply
          ? `${c.name} - consider_alternative`
          : `${c.name} - good_option`,
        color: c.oversupply ? "orange" : "green",
        warning: c.oversupply ? "oversupply_warning" : null,
        details: [
          { key: "field_name", value: farm.fieldName },
          { key: "soil_suitable", value: farm.soilType },
          { key: "ideal_for", value: `${season} season in ${city}` },
          { key: "temp_range", value: `${c.minTemp}°C - ${c.maxTemp}°C` },
          { key: "suitability", value: `${c.suitability}%` },
          { key: "seed_type", value: c.seedType },
          { key: "good_until", value: untilMonth }
        ]
      }));

      /* ------------- PUSH TO OUTPUT ------------- */
      output.push({
        fieldId: farm._id,
        fieldName: farm.fieldName,
        soilType: farm.soilType,
        locked: false,
        recommendations: recs
      });
    }

    /* ========== WEATHER TIPS ========== */
    let weatherTip = "weather_stable";
    if (condition.includes("rain") && season === "dry") weatherTip = "unexpected_rain_dry";
    else if (condition.includes("clear") && season === "rainy") weatherTip = "dry_spell_rainy";
    else if (temp > 33) weatherTip = "high_temp_warning";
    else if (temp < 20) weatherTip = "cool_temp_advice";

    return res.json({
      success: true,
      weather: { city, temp, condition },
      weatherTip,
      data: output
    });

  } catch (err) {
    console.error("❌ AI error:", err);
    res.status(500).json({ success: false, message: "server_error" });
  }
});

export default router;