import Task from "../models/Task.js";

// ➕ Add new task
// ➕ Add new task
export const addTask = async (req, res) => {
  try {
    const { userId, fieldId, type, taskType, crop, date, fieldName, kilos } = req.body;

    const finalTaskType = taskType || type;

    if (!userId || !fieldId || !finalTaskType || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, fieldId, taskType/type, date",
      });
    }

    const task = await Task.create({
      userId,
      fieldId,                     // ✅ store it
      taskType: finalTaskType,
      crop: crop || "Unspecified",
      date,
      fieldName: fieldName || "Unknown Field",
      kilos: kilos || 0,
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("❌ Add task error:", err);
    res.status(500).json({ success: false, message: "Server error while adding task" });
  }
};

// 📅 Get all tasks for a user
export const getTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.find({ userId }).sort({ date: 1 });

    res.json({ success: true, tasks });
  } catch (err) {
    console.error("❌ Fetch tasks error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};
