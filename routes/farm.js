import express from "express";
import {
  getFarmByUser,
  updateFarm,
} from "../controllers/farmController.js";
import Farm from "../models/Farm.js";

const router = express.Router();

// 🔍 Debug route
router.get("/debug", (req, res) => {
  res.send("Farm Route Mounted Correctly!");
});

//
// ──────────────────────────────────────────────
//   ✅ EXISTING ENDPOINTS (keep these)
// ──────────────────────────────────────────────
//

// Fetch farm(s) by user ID
router.get("/:userId", getFarmByUser);

// Update or create a farm for a user (single-farm compatibility)
router.put("/update/:userId", updateFarm);

//
// ──────────────────────────────────────────────
//   🌾 NEW ENDPOINTS FOR MULTIPLE FIELDS
// ──────────────────────────────────────────────
//

// 🆕 Add new farm field
router.post("/add", async (req, res) => {
  try {
    const farm = new Farm({
      userId: req.body.userId,
      fieldName: req.body.fieldName,
      soilType: req.body.soilType,
      wateringMethod: req.body.wateringMethod,
      lastYearCrop: req.body.lastYearCrop,
      fieldSize: req.body.fieldSize,
    });
    await farm.save();
    res.status(201).json({ success: true, farm });
  } catch (err) {
    console.error("❌ Error saving farm:", err);
    res.status(500).json({ success: false, message: "Error saving farm" });
  }
});

// ✏️ Update existing field by farm ID
router.put("/update-field/:id", async (req, res) => {
  try {
    const updated = await Farm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Farm field not found" });
    res.json({ success: true, farm: updated });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🗑️ Delete field by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await Farm.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Farm field not found" });
    res.json({ success: true, message: "Field deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
