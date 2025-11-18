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
   ✅ 1. ADMIN: GET ALL FARMS
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
   ✅ 2. GET ALL YIELDS (GLOBAL) — MUST BE FIRST BEFORE /:userId
========================================================== */
router.get("/all/yields", async (req, res) => {
  try {
    const allFarms = await Farm.find({})
      .populate("userId", "username")
      .lean();

    const allYields = [];

    allFarms.forEach((farm) => {
      farm.fields?.forEach((field) => {
        const harvestTask = field.tasks?.find((t) =>
          t.type?.toLowerCase().includes("harvest")
        );

        if (harvestTask && harvestTask.kilos) {
          allYields.push({
            farmerId: farm.userId?._id,
            farmer: farm.userId?.username || "Unknown Farmer",
            fieldName: field.fieldName,
            crop: field.selectedCrop,
            yield: harvestTask.kilos,
            date: harvestTask.date || field.completedAt || new Date(),
          });
        }
      });
    });

    return res.json({
      success: true,
      data: allYields,
    });
  } catch (err) {
    console.error("❌ Error loading all yields:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching yield data",
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
   5. FIELD DETAILS — MUST BE BEFORE /:userId
========================================================== */
router.get("/field/:fieldId/details", getFieldDetails);

/* ==========================================================
   6. USER YIELD TREND (SPECIFIC USER)
========================================================== */
router.get("/:userId/yield", getYieldTrendByUser);

/* ==========================================================
   7. USER FARMS
========================================================== */
router.get("/:userId", getFarmByUser);

/* ==========================================================
   8. FARM CRUD 
========================================================== */
router.post("/", addFarmField);
router.put("/select-crop", saveSelectedCrop);
router.put("/:id", updateFieldById);

/* ==========================================================
   9. DELETE / ARCHIVE FIELD
========================================================== */
router.delete("/:id", archiveField);

/* ==========================================================
   🔟 MARK FIELD HARVESTED
========================================================== */
router.patch("/:id/harvest", markFieldHarvested);

/* ==========================================================
   1️⃣1️⃣ TASKS
========================================================== */
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

export default router;