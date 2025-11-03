
import express from "express";
import Farm from "../models/Farm.js";
import {
  getFarmByUser,
  addTask,
  getTasksByUser,
  completeTask,
  updateFarm,
  addFarmField,
  getYieldDataByUser,
  getYieldStats,
  updateFieldById
} from "../controllers/farmController.js";

const router = express.Router();
// ✅ Get all farms (for Admin Dashboard)
router.get("/", async (req, res) => {
  try {
    const farms = await Farm.find().populate("userId", "username barangay");
    res.json({ success: true, farms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🟢 FARM ROUTES
router.get("/:userId", getFarmByUser);
router.post("/", addFarmField);
router.put("/:id", updateFieldById);

// 🟢 TASK ROUTES
router.get("/tasks/:userId", getTasksByUser);
router.post("/tasks", addTask);
router.patch("/tasks/:id/complete", completeTask);

// 🟢 UPDATE DEFAULT FARM
router.put("/update/:userId", updateFarm);
router.get("/yields/:userId", getYieldDataByUser);
router.get("/yields/:userId", getYieldStats);
export default router;