// routes/cropRoutes.js
import express from "express";
import Crop from "../models/Crop.js"; // <- make sure your Crop model path is correct

const router = express.Router();

/**
 * GET /api/crops
 * Return all crops
 */
router.get("/", async (req, res) => {
  try {
    const crops = await Crop.find({}).sort({ name: 1 });
    return res.json(crops);
  } catch (err) {
    console.error("Crop fetch error:", err);
    return res.status(500).json({ success: false, message: "server_error" });
  }
});

/**
 * GET /api/crops/:id
 * Get single crop by id
 */
router.get("/:id", async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ success: false, message: "crop_not_found" });
    return res.json(crop);
  } catch (err) {
    console.error("Crop fetch by id error:", err);
    return res.status(500).json({ success: false, message: "server_error" });
  }
});

/**
 * PUT /api/crops/:id
 * Update crop (admin)
 */
router.put("/:id", async (req, res) => {
  try {
    const update = req.body || {};
    const crop = await Crop.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!crop) return res.status(404).json({ success: false, message: "crop_not_found" });
    return res.json({ success: true, crop });
  } catch (err) {
    console.error("Crop update error:", err);
    return res.status(500).json({ success: false, message: "server_error" });
  }
});

/**
 * GET /api/crops/seed
 * Lightweight seed endpoint — call once to create the default crops.
 * If docs already exist by name, they will be skipped.
 */
router.get("/seed", async (req, res) => {
  try {
    const seedData = [
      { name: "Radish", minTemp: 10, maxTemp: 25, minHarvestDays: 20, maxHarvestDays: 30, soilTypes: ["Loam", "Sandy"], idealSeason: "dry", seedType: "root", oversupply: false },
      { name: "Lettuce", minTemp: 10, maxTemp: 24, minHarvestDays: 30, maxHarvestDays: 50, soilTypes: ["Loam"], idealSeason: "dry", seedType: "leaf", oversupply: false },
      { name: "Zucchini", minTemp: 16, maxTemp: 30, minHarvestDays: 35, maxHarvestDays: 50, soilTypes: ["Loam", "Sandy"], idealSeason: "rainy", seedType: "vegetable", oversupply: false },
      { name: "Cucumber", minTemp: 18, maxTemp: 32, minHarvestDays: 45, maxHarvestDays: 70, soilTypes: ["Loam"], idealSeason: "rainy", seedType: "vegetable", oversupply: false },
      { name: "Tomato", minTemp: 18, maxTemp: 32, minHarvestDays: 60, maxHarvestDays: 90, soilTypes: ["Loam"], idealSeason: "rainy", seedType: "fruit", oversupply: false },
      { name: "Potato", minTemp: 10, maxTemp: 24, minHarvestDays: 90, maxHarvestDays: 120, soilTypes: ["Loam", "Clay"], idealSeason: "dry", seedType: "tuber", oversupply: false },
      { name: "Corn", minTemp: 18, maxTemp: 32, minHarvestDays: 90, maxHarvestDays: 120, soilTypes: ["Loam", "Sandy"], idealSeason: "rainy", seedType: "grain", oversupply: false },
      { name: "Watermelon", minTemp: 20, maxTemp: 35, minHarvestDays: 70, maxHarvestDays: 100, soilTypes: ["Sandy", "Loam"], idealSeason: "rainy", seedType: "fruit", oversupply: false },
      { name: "Carrot", minTemp: 10, maxTemp: 25, minHarvestDays: 70, maxHarvestDays: 80, soilTypes: ["Loam", "Sandy"], idealSeason: "dry", seedType: "root", oversupply: false },
      { name: "Pepper", minTemp: 18, maxTemp: 32, minHarvestDays: 60, maxHarvestDays: 90, soilTypes: ["Loam"], idealSeason: "rainy", seedType: "fruit", oversupply: false },
      { name: "Banana", minTemp: 20, maxTemp: 35, minHarvestDays: 270, maxHarvestDays: 360, soilTypes: ["Loam"], idealSeason: "rainy", seedType: "fruit", oversupply: false },
      { name: "Pineapple", minTemp: 18, maxTemp: 35, minHarvestDays: 540, maxHarvestDays: 720, soilTypes: ["Sandy", "Loam"], idealSeason: "dry", seedType: "fruit", oversupply: false },
      { name: "Cassava", minTemp: 20, maxTemp: 35, minHarvestDays: 270, maxHarvestDays: 540, soilTypes: ["Sandy", "Loam"], idealSeason: "rainy", seedType: "root", oversupply: false },
      { name: "Onion", minTemp: 10, maxTemp: 28, minHarvestDays: 90, maxHarvestDays: 120, soilTypes: ["Loam"], idealSeason: "dry", seedType: "bulb", oversupply: false },
      { name: "Eggplant", minTemp: 18, maxTemp: 32, minHarvestDays: 70, maxHarvestDays: 100, soilTypes: ["Loam"], idealSeason: "rainy", seedType: "fruit", oversupply: false },
      { name: "Mungbean", minTemp: 18, maxTemp: 32, minHarvestDays: 60, maxHarvestDays: 90, soilTypes: ["Loam", "Sandy"], idealSeason: "rainy", seedType: "legume", oversupply: false },
      { name: "Cabbage", minTemp: 10, maxTemp: 24, minHarvestDays: 60, maxHarvestDays: 120, soilTypes: ["Loam"], idealSeason: "dry", seedType: "leaf", oversupply: false },
      { name: "Wheat", minTemp: 5, maxTemp: 25, minHarvestDays: 90, maxHarvestDays: 150, soilTypes: ["Loam", "Clay"], idealSeason: "dry", seedType: "grain", oversupply: false },
      { name: "Vegetable", minTemp: 12, maxTemp: 30, minHarvestDays: 40, maxHarvestDays: 100, soilTypes: ["Loam"], idealSeason: "rainy", seedType: "mixed", oversupply: false },
      { name: "Rice", minTemp: 18, maxTemp: 32, minHarvestDays: 90, maxHarvestDays: 150, soilTypes: ["Clay", "Loam"], idealSeason: "rainy", seedType: "grain", oversupply: false }
    ];

    // For each seed item, insert if not exists by name
    const created = [];
    for (const s of seedData) {
      const exists = await Crop.findOne({ name: s.name });
      if (!exists) {
        const c = new Crop(s);
        await c.save();
        created.push(s.name);
      }
    }

    return res.json({ success: true, created, message: "seed_complete" });
  } catch (err) {
    console.error("Crop seed error:", err);
    return res.status(500).json({ success: false, message: "server_error" });
  }
});

export default router;
