import express from "express";
import Farm from "../models/Farm.js";
import {
  getFarmByUser,
  updateFarm,
  addFarmField,
  updateFieldById,
  deleteFieldById,
  addTask,
  getTasksByUser,
  completeTask,
} from "../controllers/farmController.js";

const router = express.Router();

// 🧭 Debug route
router.get("/debug", (req, res) => res.send("✅ Farm Route Mounted Correctly!"));

// 🟢 Fetch all farms by user ID
router.get("/:userId", getFarmByUser);

//
// ──────────────────────────────────────────────
//   🌾 CALENDAR TASKS (used by CalendarTab.dart)
// ──────────────────────────────────────────────
//

// 🟢 Add new calendar task
router.post("/tasks", addTask);
router.get("/tasks/:userId", getTasksByUser);
router.patch("tasks/:id/complete", completeTask);


// 🟢 Get all tasks for a user (used in CalendarTab)


// 🟢 Mark a task complete

//
// ──────────────────────────────────────────────
//   🌱 FARM MANAGEMENT ROUTES
// ──────────────────────────────────────────────
//

// ➕ Add new field
router.post("/add", addFarmField);

// ✏️ Update user's main farm (legacy)
router.put("/update/:userId", updateFarm);

// ✏️ Update field by ID
router.put("/update-field/:id", updateFieldById);

// 🗑️ Delete field by ID
router.delete("/delete/:id", deleteFieldById);

export default router;
