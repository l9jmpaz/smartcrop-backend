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
   ADMIN: GET ALL FARMS (Populated with username + barangay)
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
   CACHED AI RECOMMENDATIONS
========================================================== */
router.get("/cached-ai/:userId", getCachedAIRecommendations);

/* ==========================================================
   COMPLETED / ARCHIVED FIELDS (IMPORTANT ORDER)
========================================================== */
router.get("/completed/:userId", getCompletedFields);

/* ==========================================================
   FIELD DETAILS (IMPORTANT ORDER)
========================================================== */
router.get("/:fieldId/details", getFieldDetails);

/* ==========================================================
   FARM DATA FOR USER (ACTIVE FIELDS)
========================================================== */
router.get("/:userId", getFarmByUser);
router.get("/:userId/yield", getYieldTrendByUser);
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

export default router;
