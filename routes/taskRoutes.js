import express from "express";
import { addTask, completeTask } from "../controllers/taskController.js";

const router = express.Router();

router.post("/", addTask);
router.patch("/:id/complete", completeTask);

export default router;