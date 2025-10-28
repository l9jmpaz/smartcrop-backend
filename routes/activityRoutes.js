// routes/activityRoutes.js
import express from "express";
import { addActivity, getActivities } from "../controllers/activityController.js";
const router = express.Router();

router.post("/:userId", addActivity);
router.get("/:userId", getActivities);

export default router;