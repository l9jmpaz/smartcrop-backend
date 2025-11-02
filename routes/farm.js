import express from "express";
import {
  getFarmByUser,
  addTask,
  getTasksByUser,
  completeTask,
  updateFarm,
  addFarmField,
  getYieldDataByUser,
  updateFieldById
} from "../controllers/farmController.js";

const router = express.Router();

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

export default router;