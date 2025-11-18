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
   1. ADMIN GET ALL FARMS
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
   2. GLOBAL YIELDS (must be FIRST)
========================================================== */
router.get("/all/yields", async (req, res) => {
  try {
    const allFarms = await Farm.find({})
      .populate("userId", "username")
      .lean();

    const allYields = [];

    // Loop through fields array (correct)
    allFarms.forEach(farm => {
      (farm.fields || []).forEach(field => {
        const harvestTask = field.tasks?.find(
          t =>
            t.type?.toLowerCase().includes("harvest") &&
            t.completed &&
            t.kilos > 0
        );

        if (harvestTask) {
          allYields.push({
            farmerId: farm.userId?._id,
            farmer: farm.userId?.username || "Unknown Farmer",
            fieldId: field._id,
            fieldName: field.fieldName,
            crop: harvestTask.crop || field.selectedCrop,
            yield: harvestTask.kilos,
            date: harvestTask.date || field.completedAt || new Date(),
          });
        }
      });
    });

    return res.json({ success: true, data: allYields });
  } catch (err) {
    console.error("❌ Error loading all yields:", err);
    res.status(500).json({ success: false, message: "Server error while fetching yield data" });
  }
});

/* ==========================================================
   3. TASK ROUTES — MUST BE BEFORE ANY :userId ROUTE
========================================================== */
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

/* ==========================================================
   4. CACHED AI
========================================================== */
router.get("/cached-ai/:userId", getCachedAIRecommendations);

/* ==========================================================
   5. COMPLETED FIELDS
========================================================== */
router.get("/completed/:userId", getCompletedFields);

/* ==========================================================
   6. FIELD DETAILS
========================================================== */
router.get("/field/:fieldId/details", getFieldDetails);

/* ==========================================================
   7. USER YIELD TREND
========================================================== */
router.get("/:userId/yield", getYieldTrendByUser);

/* ==========================================================
   8. USER FARMS
========================================================== */
router.get("/:userId", getFarmByUser);

/* ==========================================================
   9. FARM CRUD
========================================================== */
router.post("/", addFarmField);
router.put("/select-crop", saveSelectedCrop);
router.put("/:id", updateFieldById);

/* ==========================================================
   10. DELETE / ARCHIVE FIELD
========================================================== */
router.delete("/:id", archiveField);

/* ==========================================================
   11. MARK FIELD HARVESTED
========================================================== */
router.patch("/:id/harvest", markFieldHarvested);

export default router;