// routes/supportRoute.js
router.post("/support", async (req, res) => {
  const { userId, message } = req.body;
  console.log(`Support message from ${userId}: ${message}`);
  res.json({ success: true });
});
