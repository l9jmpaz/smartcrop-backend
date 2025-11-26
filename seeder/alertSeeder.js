import mongoose from "mongoose";
import Alert from "../models/Alert.js";

// ⬇️ PUT YOUR RENDER MONGODB CONNECTION STRING HERE ⬇️
mongoose.connect(
  "mongodb+srv://l9jmpaz_db_user:Decten19@cluster0.w0lhhob.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connection;

    // Clear alerts
    await Alert.deleteMany();
    console.log("Old alerts removed.");

    // Insert 3 alerts
    await Alert.insertMany([
      {
        message: "Weather API failed to synchronize",
        severity: "Critical",
        affects: "Weather System",
        status: "active",
        createdAt: new Date(),
      },
      {
        message: "Server latency exceeded 2000ms",
        severity: "Critical",
        affects: "Backend Server",
        status: "active",
        createdAt: new Date(),
      },
      {
        message: "Farm data processing queue delayed",
        severity: "Critical",
        affects: "Farm Scheduler",
        status: "active",
        createdAt: new Date(),
      }
    ]);

    console.log("✔ Alerts Seeded Successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seeder Error:", error);
    mongoose.connection.close();
  }
};

seed();