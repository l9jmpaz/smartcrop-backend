import express from "express";
import Farm from "../models/Farm.js";

const router = express.Router();

// 🟢 Add a task to a specific farm (field)
router.post("/tasks", async (req, res) => {
  try {
    const { userId, fieldId, fieldName, date, type, crop } = req.body;

    if (!userId || !fieldId || !date || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (userId, fieldId, date, or type).",
      });
    }

    // Build the task object
    const task = {
      userId,
      fieldName,
      date,
      type,
      crop: crop || "",
      completed: false,
      createdAt: new Date(),
    };

    // ✅ Find by farm ID, not by user ID
    const farm = await Farm.findById(fieldId);
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm not found for that fieldId.",
      });
    }

    // Push new task into the farm's tasks array
    farm.tasks.push(task);
    await farm.save();

    return res.status(201).json({
      success: true,
      message: "Task added successfully!",
      task,
    });
  } catch (err) {
    console.error("❌ Error adding task:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while adding task.",
    });
  }
});

export default router;