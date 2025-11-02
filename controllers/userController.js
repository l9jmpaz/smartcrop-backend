// PUT /api/user/update/:id
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, location, password } = req.body;

    const updateData = { name, email, location };
    if (password && password.trim() !== "") {
      updateData.password = password; // make sure you hash it if using passwords
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
})