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

// ------------------------- FIELD DETAILS -------------------------
router.get("/field/:fieldId/details", getFieldDetails);

// ------------------------- COMPLETED (ARCHIVED) FIELDS -------------------------
router.get("/completed/:userId", getCompletedFields);

// ------------------------- FARM CRUD -------------------------
router.get("/user/:userId", getFarmByUser);
router.post("/", addFarmField);
router.put("/select-crop", saveSelectedCrop);
router.put("/:id", updateFieldById);
router.delete("/:id", archiveField);

// ------------------------- MARK HARVEST (ARCHIVE) -------------------------
router.patch("/:id/harvest", markFieldHarvested);

// ------------------------- TASK ROUTES -------------------------
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

export default router;
