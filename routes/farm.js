import express from "express";
import Farm from "../models/Farm.js";

import {
  getFarmByUser,
  addFarmField,
  updateFieldById,
  archiveField,
  getTasksByUser,
  addTask,
  completeTask,
  markFieldHarvested,
  getCompletedFields,
  saveSelectedCrop,
  getCachedAIRecommendations,
  getFieldDetails,
  getYieldTrendByUser,
} from "../controllers/farmController.js";

const router = express.Router();

/* ==========================================================
   1. ADMIN — GET ALL FARMS
========================================================== */
router.get("/", async (req, res) => {
  try {
    const farms = await Farm.find().populate("userId", "username barangay");
    res.json({ success: true, farms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================
   2. GLOBAL — GET ALL YIELDS
========================================================== */
router.get("/all/yields", async (req, res) => {
  try {
    const allFarms = await Farm.find({})
      .populate("userId", "username")
      .lean();

    const allYields = [];

    allFarms.forEach((farm) => {
      (farm.tasks || []).forEach((task) => {
        if (
          task.type?.toLowerCase().includes("harvest") &&
          task.completed &&
          Number(task.kilos) > 0
        ) {
          allYields.push({
            farmerId: farm.userId?._id,
            farmer: farm.userId?.username || "Unknown Farmer",
            fieldId: farm._id,
            fieldName: farm.fieldName,
            crop: task.crop || farm.selectedCrop || "Unknown Crop",
            yield: task.kilos,
            date: task.date || farm.completedAt || new Date(),
          });
        }
      });
    });

    return res.json({ success: true, data: allYields });
  } catch (err) {
    console.error("❌ ALL YIELDS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching global yield data",
    });
  }
});

/* ==========================================================
   3. CACHED AI
========================================================== */
router.get("/cached-ai/:userId", getCachedAIRecommendations);

/* ==========================================================
   4. COMPLETED FIELDS
========================================================== */
router.get("/completed/:userId", getCompletedFields);

/* ==========================================================
   5. FIELD DETAILS
========================================================== */
router.get("/field/:fieldId/details", getFieldDetails);

/* ==========================================================
   6. YIELD TREND FOR SPECIFIC USER
========================================================== */
router.get("/user/:userId/yield", getYieldTrendByUser);

/* ==========================================================
   7. GET ALL FARMS BY USER
========================================================== */
router.get("/user/:userId", getFarmByUser);

/* ==========================================================
   8. ADD FIELD
========================================================== */
router.post("/", addFarmField);

/* ==========================================================
   9. SELECT CROP
========================================================== */
router.put("/select-crop", saveSelectedCrop);

/* ==========================================================
   10. UPDATE FIELD
========================================================== */
router.put("/:id", updateFieldById);

/* ==========================================================
   11. DELETE / ARCHIVE FIELD
========================================================== */
router.delete("/:id", archiveField);

/* ==========================================================
   12. MARK HARVESTED
========================================================== */
router.patch("/:id/harvest", markFieldHarvested);

/* ==========================================================
   13. TASKS SYSTEM
========================================================== */
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

export default router;