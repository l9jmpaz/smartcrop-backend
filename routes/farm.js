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
} from "../controllers/farmController.js";

const router = express.Router();

// ------------------------- ADMIN ROUTES -------------------------
router.get("/", async (req, res) => {
  try {
    const farms = await Farm.find().populate("userId", "username barangay");
    res.json({ success: true, farms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ------------------------- CACHED AI -------------------------
router.get("/cached-ai/:userId", getCachedAIRecommendations);

// ------------------------- COMPLETED FIELDS (MUST COME BEFORE /:userId) -------------------------
router.get("/completed/:userId", getCompletedFields);

// ------------------------- FIELD DETAILS -------------------------
router.get("/:fieldId/details", getFieldDetails);

// ------------------------- FARM CRUD -------------------------
router.get("/:userId", getFarmByUser);
router.post("/", addFarmField);
router.put("/select-crop", saveSelectedCrop);
router.put("/:id", updateFieldById);

// DELETE / ARCHIVE FIELD
router.delete("/:id", archiveField);

// MARK HARVESTED
router.patch("/:id/harvest", markFieldHarvested);

// ------------------------- TASKS -------------------------
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

export default router;