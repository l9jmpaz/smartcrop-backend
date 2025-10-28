import mongoose from "mongoose";
import dotenv from "dotenv";
import Crop from "../models/Crop.js";

dotenv.config();

const crops = [
  { name: "Rice", soilTypes: ["Clay", "Clay Loam"], waterRequirement: "high", idealSeason: "rainy", oversupply: true, description: "Primary staple crop, best in rainy months." },
  { name: "Corn", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", oversupply: true, description: "Good during wet season but often oversupplied." },
  { name: "Peanut", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", description: "Excellent rotation crop after rice." },
  { name: "Mungbean", soilTypes: ["Loam"], waterRequirement: "low", idealSeason: "dry", description: "Short-term legume, improves soil fertility." },
  { name: "Cassava", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", description: "Drought-tolerant root crop." },
  { name: "Sweet Potato", soilTypes: ["Loam"], waterRequirement: "low", idealSeason: "dry", description: "Popular dry-season crop, easy to grow." },
  { name: "Eggplant", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", description: "High yield with regular watering." },
  { name: "Okra", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", description: "Tolerant to hot and wet climate." },
  { name: "Bitter Gourd", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", description: "Profitable crop, requires trellis." },
  { name: "Squash", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "rainy", description: "Good off-season crop." },
  { name: "Lettuce", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", description: "Best for cooler months." },
  { name: "Cabbage", soilTypes: ["Loam"], waterRequirement: "high", idealSeason: "dry", description: "High-value vegetable, cool climate preferred." },
  { name: "Carrot", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", description: "Root crop for cooler months." },
  { name: "Tomato", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", description: "Profitable crop; avoid excess moisture." },
  { name: "Bell Pepper", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", description: "High-value crop for dry months." },
  { name: "Celery", soilTypes: ["Loam"], waterRequirement: "high", idealSeason: "dry", description: "Needs consistent watering." },
  { name: "Broccoli", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "dry", description: "Cool weather crop." },
  { name: "Onion", soilTypes: ["Sandy Loam"], waterRequirement: "moderate", idealSeason: "dry", description: "Thrives in well-drained soil." },
  { name: "Garlic", soilTypes: ["Sandy Loam"], waterRequirement: "low", idealSeason: "dry", description: "Good for dry months." },
  { name: "Chayote", soilTypes: ["Loam"], waterRequirement: "moderate", idealSeason: "rainy", description: "Vine crop, good for humid weather." },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Crop.deleteMany();
    await Crop.insertMany(crops);
    console.log("✅ Crops seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding crops:", err);
    process.exit(1);
  }
};

seed();