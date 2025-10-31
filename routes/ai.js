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
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🧠 Main AI Recommendation Route (Now per-field)
router.get("/recommend/:userId", async (req, res) => {
  try {
    // 🔹 1. Validate User
    const user = await User.findById(req.params.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // 🔹 2. Get all Farms of the User
    const farms = await Farm.find({ userId: req.params.userId });
    if (!farms.length)
      return res.json({
        success: true,
        message: "No fields found for this user.",
        data: [],
      });

    // 🔹 3. Fetch Weather (Tanauan City default)
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

    console.log(`Weather in ${city}: ${temp}°C, ${condition}, ${season} season`);

    // 🔹 4. Load all Crops
    const allCrops = await Crop.find({});
    console.log("🌾 Total Crops in DB:", allCrops.length);

    // 🔹 5. Generate Recommendations for Each Farm Field
    const allFieldRecommendations = [];

    for (const farm of farms) {
      const soilType = (farm.soilType || "").toLowerCase();
      const fieldName = farm.fieldName || "Unnamed Field";

      // ✅ Case-insensitive match
      let matched = allCrops.filter((crop) => {
        const soilMatch = crop.soilTypes
          ?.map((s) => s.toLowerCase())
          .includes(soilType);
        const seasonMatch =
          (crop.idealSeason || "").toLowerCase() === season.toLowerCase();
        const tempMatch = crop.minTemp <= temp && crop.maxTemp >= temp;
        return soilMatch && seasonMatch && tempMatch;
      });

      // 🟡 Broader soil-type fallback
      if (!matched.length) {
        matched = allCrops.filter((crop) =>
          crop.soilTypes
            ?.map((s) => s.toLowerCase())
            .includes(soilType)
        );
      }

      // 🟡 Random fallback if still empty
      if (!matched.length) {
        matched = allCrops.sort(() => 0.5 - Math.random()).slice(0, 3);
      }

      // ✅ Compute suitability
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

      // ✅ Sort & pick top 3
      matched.sort((a, b) => b.suitability - a.suitability);
      const selected = matched.slice(0, 3);

      // ✅ Build field-specific recommendations
      const untilMonth = season === "rainy" ? "December 2025" : "May 2026";

      const fieldRecommendations = selected.map((c) => ({
        title: c.oversupply
          ? `${c.name} - Consider Alternative`
          : `${c.name} - Good Option`,
        color: c.oversupply ? "orange" : "green",
        details: [
          `Field: ${fieldName}`,
          `Soil: Suitable for ${farm.soilType} soil`,
          `Water: ${c.waterRequirement} requirement`,
          `Season: Ideal for ${season} months in ${city}`,
          `Temperature: Ideal range ${c.minTemp}°C – ${c.maxTemp}°C`,
          `Suitability Score: ${c.suitability}%`,
          `Seed Type: ${c.seedType}`,
         `🌾 Good until ${untilMonth}`,
        ],
        warning: c.oversupply
          ? `⚠ ${c.name} is currently oversupplied. Prices may drop.`
          : null,
      }));

      // Push this field’s result
      allFieldRecommendations.push({
        fieldName,
        soilType: farm.soilType,
        recommendations: fieldRecommendations,
      });

      console.log(`✅ ${fieldName} — ${selected.length} crops recommended`);
    }

    // 🔹 6. Weather tip (same for all)
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
      weatherTip =
        "Weather conditions remain stable and suitable for most crops.";
    }

    // 🔹 7. Respond
    res.json({
      success: true,
      weather: { city, temp, condition },
      weatherTip,
      data: allFieldRecommendations, // ✅ field-based results
    });
  } catch (err) {
    console.error("❌ AI recommend error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
