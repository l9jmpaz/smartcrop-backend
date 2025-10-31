import Task from "../models/Task.js";

// ➕ Add new task
// ➕ Add new task
export const addTask = async (req, res) => {
  try {
    const { userId, type, taskType, crop, date, fieldName } = req.body;

    // support both type and taskType
    const finalTaskType = taskType || type;
    if (!userId || !finalTaskType || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (userId, taskType/type, date)",
      });
    }

    const task = await Task.create({
      userId,
      taskType: finalTaskType,
      crop: crop || "Unspecified",
      date,
      fieldName: fieldName || "Unknown Field",
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