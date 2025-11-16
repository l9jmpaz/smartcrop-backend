// taskController.js
import Farm from "../models/Farm.js";

// ➕ ADD NEW TASK
export const addTask = async (req, res) => {
  try {
    const { userId, fieldId, crop, type, date, kilos } = req.body;

    if (!userId || !fieldId || !type || !date) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // get farm
    const farm = await Farm.findById(fieldId);
    if (!farm) {
      return res.status(404).json({ success: false, message: "Farm not found" });
    }

    const newTask = {
      _id: new Date().getTime().toString(), // simpler unique ID
      type,
      crop,
      date: new Date(date),
      completed: false,
      kilos: kilos || 0,
      fieldName: farm.fieldName
    };

    farm.tasks.push(newTask);
    await farm.save();

    return res.status(201).json({
      success: true,
      message: "Task saved",
      task: newTask
    });

  } catch (err) {
    console.error("❌ Add Task Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✔ COMPLETE TASK
// taskController.js
export const completeTask = async (req, res) => {
  return res.json({
    success: false,
    message: "This endpoint is no longer used. Use /farm/tasks/:id/complete instead."
  });
};