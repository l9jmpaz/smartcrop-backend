// -----------------------------------------------------------
// 🚀 SmartCrop Backend (Clean + Active User System)
// -----------------------------------------------------------

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import axios from "axios";

import connectDB from "./config/db.js";
import User from "./models/User.js";

// Routes
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import feedbackRoutes from "./routes/feedback.js";
import reportRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/adminRoutes.js";
import yieldRoutes from "./routes/yieldRoutes.js";
import profileRoutes from "./routes/profile.js";
import weatherRoutes from "./routes/weather.js";
import farmRoutes from "./routes/farm.js";
import dashboardRoutes from "./routes/dashboard.js";
import supportRoutes from "./routes/support.js";
import aiRoutes from "./routes/ai.js";
import activityRoutes from "./routes/activityRoutes.js";
import otpRoutes from "./routes/otp.js";
import cropRoutes from "./routes/cropRoutes.js";
import soilTypeRoutes from "./routes/soilTypeRoutes.js";
import fastRoute from "./routes/adminFastRoute.js";
dotenv.config();
connectDB();

const app = express();

// -----------------------------------------------------------
// 📁 Create uploads folder if missing
// -----------------------------------------------------------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// -----------------------------------------------------------
// 🔧 Middleware
// -----------------------------------------------------------
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "userId", "userRole"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// -----------------------------------------------------------
// 📊 REAL ACTIVE FARMER METRIC (DB-BASED)
// -----------------------------------------------------------
//
// Flutter calls:
//   PATCH /api/users/:id/active → sets status = Active
//   PATCH /api/users/:id/inactive → sets status = Inactive
//
// Dashboard reads from MongoDB directly.
//

app.get("/metrics", async (req, res) => {
  try {
    const activeCount = await User.countDocuments({
      status: "Active",
      role: "user", // farmers only
    });

    res.json({
      success: true,
      activeFarmers: activeCount,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("metrics error:", err);
    res.status(500).json({ success: false });
  }
});

// -----------------------------------------------------------
// ❤️ Health Check
// -----------------------------------------------------------
app.get("/health", (req, res) => res.json({ status: "ok" }));

// -----------------------------------------------------------
// 🚏 API Routes
// -----------------------------------------------------------
app.use("/api/activities", activityRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);
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
app.use("/api/otp", otpRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/soiltypes", soilTypeRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api", fastRoute);

// -----------------------------------------------------------
// 🏠 Default Route
// -----------------------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ SmartCrop backend is running!");
});

// -----------------------------------------------------------
// 🌦 Daily Weather Auto-update (6AM)
// -----------------------------------------------------------
cron.schedule("0 6 * * *", async () => {
  try {
    console.log("🌤️ [CRON] Running daily weather update...");
    await axios.get(
      "https://smartcrop-backend-1.onrender.com/api/weather/daily-update"
    );
    console.log("✅ [CRON] Weather updated successfully!");
  } catch (err) {
    console.error(
      "❌ [CRON] Failed to auto-update weather:",
      err.message
    );
  }
});

// -----------------------------------------------------------
// 👤 Create Default Admin
// -----------------------------------------------------------

// -----------------------------------------------------------
// 🚀 Start Server
// -----------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on http://0.0.0.0:${PORT}`)
);