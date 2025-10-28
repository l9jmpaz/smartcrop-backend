import Task from "../models/Task.js";

// ➕ Add new task
export const addTask = async (req, res) => {
  try {
    const { userId, taskType, crop, date } = req.body;

    const task = await Task.create({ userId, taskType, crop, date });
    res.json({ success: true, task });
  } catch (err) {
    console.error("❌ Add task error:", err);
    res.status(500).json({ success: false, message: "Failed to add task" });
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