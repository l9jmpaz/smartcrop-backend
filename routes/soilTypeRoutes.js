import express from "express";
import SoilType from "../models/SoilType.js";

const router = express.Router();

// GET all soil types
router.get("/", async (req, res) => {
  try {
    const soils = await SoilType.find();
    res.json({ success: true, data: soils });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ADD soil type
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    const newSoil = new SoilType({ name, description });
    await newSoil.save();

    res.status(201).json({ success: true, data: newSoil });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add soil type" });
  }
});

// DELETE soil type
router.delete("/:id", async (req, res) => {
  try {
    await SoilType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Soil type deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

export default router;