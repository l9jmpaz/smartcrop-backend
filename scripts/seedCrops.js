import mongoose from "mongoose";
import dotenv from "dotenv";
import Crop from "../models/Crop.js";

dotenv.config();

const crops = [
  { name: "Rice", soilTypes: ["Clay", "Clay Loam"], waterRequirement: "high", idealSeason: "rainy", oversupply: true, minTemp: 20, maxTemp: 38, description: "Primary staple crop, best in rainy months." },
  { name: "Corn", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", oversupply: true, minTemp: 18, maxTemp: 35, description: "Good during wet season but often oversupplied." },
  { name: "Peanut", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", minTemp: 22, maxTemp: 32, description: "Excellent rotation crop after rice." },
  { name: "Mungbean", soilTypes: ["Loam"], waterRequirement: "low", idealSeason: "dry", minTemp: 21, maxTemp: 33, description: "Short-term legume, improves soil fertility." },
  { name: "Cassava", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", minTemp: 25, maxTemp: 35, description: "Drought-tolerant root crop." },
  { name: "Sweet Potato", soilTypes: ["Loam"], waterRequirement: "low", idealSeason: "dry", minTemp: 20, maxTemp: 32, description: "Popular dry-season crop, easy to grow." },
  { name: "Eggplant", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", minTemp: 20, maxTemp: 35, description: "High yield with regular watering." },
  { name: "Okra", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", minTemp: 22, maxTemp: 36, description: "Tolerant to hot and wet climate." },
  { name: "Bitter Gourd", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", minTemp: 22, maxTemp: 35, description: "Profitable crop, requires trellis." },
  { name: "Squash", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "rainy", minTemp: 20, maxTemp: 35, description: "Good off-season crop." },
  { name: "Lettuce", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", minTemp: 10, maxTemp: 25, description: "Best for cooler months." },
  { name: "Cabbage", soilTypes: ["Loam"], waterRequirement: "high", idealSeason: "dry", minTemp: 12, maxTemp: 25, description: "High-value vegetable, cool climate preferred." },
  { name: "Carrot", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", minTemp: 10, maxTemp: 28, description: "Root crop for cooler months." },
  { name: "Tomato", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", minTemp: 18, maxTemp: 32, description: "Profitable crop; avoid excess moisture." },
  { name: "Bell Pepper", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", minTemp: 18, maxTemp: 30, description: "High-value crop for dry months." },
  { name: "Celery", soilTypes: ["Loam"], waterRequirement: "high", idealSeason: "dry", minTemp: 12, maxTemp: 24, description: "Needs consistent watering." },
  { name: "Broccoli", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", minTemp: 10, maxTemp: 24, description: "Cool weather crop." },
  { name: "Onion", soilTypes: ["Sandy Loam"], waterRequirement: "moderate", idealSeason: "dry", minTemp: 13, maxTemp: 30, description: "Thrives in well-drained soil." },
  { name: "Garlic", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", minTemp: 13, maxTemp: 28, description: "Good for dry months." },
  { name: "Chayote", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", minTemp: 18, maxTemp: 30, description: "Vine crop, good for humid weather." },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Crop.deleteMany();
    await Crop.insertMany(crops);
    console.log("✅ Crops seeded successfully with temperature data!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding crops:", err);
    process.exit(1);
  }
};

seed();