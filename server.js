// backend/server.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectDB from "./config/db.js";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import feedbackRoutes from "./routes/feedback.js";
import reportRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/adminRoutes.js";
import yieldRoutes from "./routes/yieldRoutes.js";
import profileRoutes from "./routes/profile.js";
import weatherRoutes from "./routes/weather.js"; // ✅ Correct route
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import farmRoutes from "./routes/farm.js";
import dashboardRoutes from "./routes/dashboard.js";
import supportRoutes from "./routes/support.js";
import aiRoutes from "./routes/ai.js";
import activityRoutes from "./routes/activityRoutes.js";

connectDB();

const app = express();
app.use(cors({origin: "*",methods:["GET", "POST", "PUT", "DELETE"],allowedHeaders: ["Content-Type","Authorization"]}));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
// ✅ Mount routes
app.use("/api/activities", activityRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai" , aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/yields", yieldRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/farm", farmRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT  || 5000;

app.get("/", (req, res) => res.send("✅ SmartCrop backend is running!"));
// 🌦️ Auto-update weather daily using Open-Meteo
import cron from "node-cron";
import axios from "axios";

cron.schedule("0 6 * * *", async () => {
  try {
    console.log("🌤️ [CRON] Running daily weather update...");
    await axios.get("https://smartcrop-backend-in5e.onrender.com/api/weather/daily-update");
    console.log("✅ [CRON] Weather updated successfully!");
  } catch (err) {
    console.error("❌ [CRON] Failed to auto-update weather:", err.message);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(` Server running on http://0.0.0.0:${PORT}`);
});

// ✅ Create default admin
async function createDefaultAdmin() {
  const exists = await User.findOne({ username: "admin" });
  if (!exists) {
    const hashedPassword = await bcrypt.hash("admin", 10);
    await User.create({ username: "admin", password: hashedPassword });
    console.log("✅ Default admin created: admin / admin");
  }
}
createDefaultAdmin();