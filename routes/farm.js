import express from "express";
import {
  getFarmByUser,
  updateFarm,
  addFarmField,
  updateFieldById,
  deleteFieldById,
} from "../controllers/farmController.js";

const router = express.Router();

// 🧩 Debug Route
router.get("/debug", (req, res) => res.send("Farm Route Mounted Correctly!"));

// 🟢 Fetch all farms by user ID
router.get("/:userId", getFarmByUser);
// 🟢 Add new calendar task
router.post("/tasks", async (req, res) => {
  try {
    const { userId, date, type, crop, fieldName } = req.body;
    if (!userId || !date || !type) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const task = {
      userId,
      date,
      type,
      crop: crop || "N/A",
      fieldName: fieldName || "",
      completed: false,
      createdAt: new Date(),
    };

    // 💾 Save to MongoDB (using your Task or Farm model)
    const saved = await Farm.updateOne(
      { userId },
      { $push: { tasks: task } },
      { upsert: true }
    );

    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("❌ Error adding task:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// 🟢 Add new field
router.post("/add", addFarmField);

// 🟢 Update user's main farm (legacy)
router.put("/update/:userId", updateFarm);

// 🟢 Update field by farm ID
router.put("/update-field/:id", updateFieldById);

// 🟢 Delete field by ID
router.delete("/delete/:id", deleteFieldById);

export default router;