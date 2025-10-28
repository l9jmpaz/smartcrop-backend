import axios from "axios";
import User from "../models/User.js";
import Farm from "../models/Farm.js";

export const getAIRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2️⃣ Get farm info
    const farm = await Farm.findOne({ userId });
    if (!farm) {
      return res.status(404).json({ success: false, message: "No farm data found" });
    }

    // 3️⃣ Weather data
    const apiKey = "5e79e7210cb543fea4a97220f8dbdd08";
    const lat = farm.latitude || 14.0833; // Tanauan fallback
    const lon = farm.longitude || 121.1500;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    console.log("🌦 Fetching weather:", weatherUrl);

    let weather;
    try {
      const weatherRes = await axios.get(weatherUrl, { headers: { Accept: "application/json" } });
      weather = weatherRes.data;
      console.log("✅ Weather data received!");
    } catch (error) {
      console.error("⚠️ Weather fetch failed, using fallback Tanauan weather");
      weather = {
        main: { temp: 30 },
        weather: [{ description: "partly cloudy" }],
        name: "Tanauan City"
      };
    }

    const temp = Math.round(weather.main.temp);
    const condition = weather.weather[0].description;
    const city = weather.name;

    // 4️⃣ AI logic
    const soilType = farm.soilType?.toLowerCase() || "clay";
    const cropType = farm.cropType?.toLowerCase() || "rice";
    const recommendations = [];

    if (soilType.includes("clay") && temp > 28) {
  recommendations.push({
    title: "Corn - Great Fit",
    color: "green",
    details: [
      `Thrives in warm, clay-rich soil.`,
      `Current temperature in ${city} (${temp}°C) is ideal.`,
      "Medium rainfall supports healthy growth."
    ]
  });
} else {
  recommendations.push({
    title: "Rice - Moderate Option",
    color: "orange",
    details: [
      `Soil Type: ${soilType}`, // ✅ backticks, not single quotes
      "Moderate irrigation needed.",
      "Avoid overproduction in high-supply areas."
    ],
    warning: "⚠️ Warning: Local rice production is high. Consider alternatives."
  });
}

    if (temp > 32) {
      recommendations.push({
        title: "Tomato - Heat Risk",
        color: "red",
        details: [
          "High temperature may affect flowering.",
          "Requires regular irrigation and shading."
        ],
        warning: "⚠️ High heat alert — yields may be reduced."
      });
    }

    return res.status(200).json({
      success: true,
      message: "AI recommendations generated successfully",
      data: recommendations,
      weather: { temp, condition, city }
    });

  } catch (err) {
    console.error("❌ AI Recommendation Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error generating AI recommendations",
      error: err.message
    });
  }
};