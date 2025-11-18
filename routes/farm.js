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
   ADMIN: GET ALL FARMS
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
   CACHED AI
========================================================== */
router.get("/cached-ai/:userId", getCachedAIRecommendations);

/* ==========================================================
   COMPLETED FIELDS
========================================================== */
router.get("/completed/:userId", getCompletedFields);

/* ==========================================================
   FIELD DETAILS
========================================================== */
router.get("/:fieldId/details", getFieldDetails);

/* ==========================================================
   YIELD TREND (MUST BE ABOVE /:userId)
========================================================== */
router.get("/:userId/yield", getYieldTrendByUser);

/* ==========================================================
   USER FARMS (ACTIVE FIELDS)
========================================================== */
router.get("/:userId", getFarmByUser);

/* ==========================================================
   FARM CRUD
========================================================== */
router.post("/", addFarmField);
router.put("/select-crop", saveSelectedCrop);
router.put("/:id", updateFieldById);

/* ==========================================================
   DELETE / ARCHIVE FIELD
========================================================== */
router.delete("/:id", archiveField);

/* ==========================================================
   MARK FIELD HARVESTED
========================================================== */
router.patch("/:id/harvest", markFieldHarvested);

/* ==========================================================
   TASKS
========================================================== */
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);
// 📌 NEW: Get ALL yield records for ALL farmers
router.get("/all/yields", async (req, res) => {
  try {
    // Find all farmers who have farms
    const allFarms = await Farm.find({})
      .populate("userId", "username")
      .lean();

    const allYields = [];

    allFarms.forEach((farm) => {
      farm.fields?.forEach((field) => {
        // Find the HARVEST task
        const harvestTask = field.tasks?.find(
          (t) => t.type?.toLowerCase().includes("harvest")
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
export default router;