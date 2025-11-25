import express from "express";
import seed from "../seed/seedUsers.js";
const router = express.Router();

router.get("/run-seed", async (req, res) => {
  try {
    await seed();
    res.send("Seeder executed!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;