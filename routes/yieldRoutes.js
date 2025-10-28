import express from "express";
import { addYield, getYieldsByUser } from "../controllers/yieldController.js";

const router = express.Router();

router.post("/", addYield);
router.get("/:userId", getYieldsByUser);

export default router;