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

// 🟢 Add new field
router.post("/add", addFarmField);

// 🟢 Update user's main farm (legacy)
router.put("/update/:userId", updateFarm);

// 🟢 Update field by farm ID
router.put("/update-field/:id", updateFieldById);

// 🟢 Delete field by ID
router.delete("/delete/:id", deleteFieldById);

export default router;