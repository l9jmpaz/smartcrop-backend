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
  saveSelectedCrop,
  getCachedAIRecommendations,
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

// ------------------------- CACHED AI (PUT THIS FIRST!) -------------------------
router.get("/cached-ai/:userId", getCachedAIRecommendations);

// ------------------------- FARM CRUD -------------------------
router.get("/:userId", getFarmByUser);
router.post("/", addFarmField);
router.put("/select-crop", saveSelectedCrop);
router.put("/:id", updateFieldById);

// Save selected crop

// ARCHIVE FIELD (Instead of delete)
router.delete("/:id", archiveField);

// USER MARKS HARVEST → archive + move to history
router.patch("/:id/harvest", markFieldHarvested);

// ------------------------- TASKS -------------------------
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

// COMPLETED fields list
router.get("/completed/:userId", async (req, res) => {
  try {
    const farms = await Farm.find({
      userId: req.params.userId,
      status: "completed",
    }).sort({ completedAt: -1 });

    res.json({ success: true, completed: farms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;