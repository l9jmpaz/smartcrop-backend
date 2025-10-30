import mongoose from "mongoose";
import dotenv from "dotenv";
import Crop from "../models/Crop.js";

dotenv.config();

const crops = [
  { name: "Rice", soilTypes: ["Clay", "Clay Loam"], waterRequirement: "high", idealSeason: "rainy", seedType: "Hybrid", minTemp: 20, maxTemp: 35, oversupply: true, description: "Best during wet season but often oversupplied." },
  { name: "Corn", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", seedType: "Hybrid", minTemp: 18, maxTemp: 34, oversupply: true, description: "Thrives during wet season but can be oversupplied." },
  { name: "Peanut", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", seedType: "Open-Pollinated", minTemp: 20, maxTemp: 35, description: "Excellent dry-season rotation crop after rice." },
  { name: "Mungbean", soilTypes: ["Loam"], waterRequirement: "low", idealSeason: "dry", seedType: "Native", minTemp: 22, maxTemp: 35, description: "Short-term legume that restores soil fertility." },
  { name: "Cassava", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", seedType: "Stem Cutting", minTemp: 20, maxTemp: 32, description: "Drought-tolerant root crop ideal for lowland areas." },
  { name: "Sweet Potato", soilTypes: ["Loam"], waterRequirement: "low", idealSeason: "dry", seedType: "Vine Cutting", minTemp: 21, maxTemp: 32, description: "Easy to grow and high in yield during dry season." },
  { name: "Eggplant", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", seedType: "Hybrid", minTemp: 22, maxTemp: 33, description: "Performs well under hot and humid conditions." },
  { name: "Okra", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", seedType: "Hybrid", minTemp: 20, maxTemp: 34, description: "Tolerant to high temperatures and heavy rainfall." },
  { name: "Bitter Gourd", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", seedType: "Hybrid", minTemp: 20, maxTemp: 34, description: "Profitable vine crop, prefers humid weather." },
  { name: "Squash", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "rainy", seedType: "Open-Pollinated", minTemp: 20, maxTemp: 35, description: "Good off-season crop with strong market demand." },
  { name: "Lettuce", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", seedType: "Hybrid", minTemp: 10, maxTemp: 25, description: "Ideal for cooler months; sensitive to heat." },
  { name: "Cabbage", soilTypes: ["Loam"], waterRequirement: "high", idealSeason: "dry", seedType: "Hybrid", minTemp: 12, maxTemp: 25, description: "Cool-weather crop for highland and dry seasons." },
  { name: "Carrot", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", seedType: "Open-Pollinated", minTemp: 10, maxTemp: 25, description: "Thrives in cooler and well-drained soils." },
  { name: "Tomato", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", seedType: "Hybrid", minTemp: 18, maxTemp: 32, description: "High-value vegetable suited for dry months." },
  { name: "Bell Pepper", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", seedType: "Hybrid", minTemp: 18, maxTemp: 30, description: "Profitable crop needing stable irrigation." },
  { name: "Celery", soilTypes: ["Loam"], waterRequirement: "high", idealSeason: "dry", seedType: "Hybrid", minTemp: 12, maxTemp: 22, description: "Needs consistent watering and cool conditions." },
  { name: "Broccoli", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", seedType: "Hybrid", minTemp: 12, maxTemp: 24, description: "Prefers cool weather, ideal for elevated areas." },
  { name: "Onion", soilTypes: ["Sandy Loam"], waterRequirement: "moderate", idealSeason: "dry", seedType: "Open-Pollinated", minTemp: 15, maxTemp: 30, description: "Thrives in well-drained sandy loam soil." },
  { name: "Garlic", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", seedType: "Clove", minTemp: 15, maxTemp: 30, description: "Best planted in dry months with low humidity." },
  { name: "Chayote", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", seedType: "Fruit Seed", minTemp: 18, maxTemp: 30, description: "Vine crop suitable for humid and rainy weather." },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Crop.deleteMany();
    await Crop.insertMany(crops);
    console.log("✅ Crops with seed types and temperature ranges seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding crops:", err);
    process.exit(1);
  }
};

seed();