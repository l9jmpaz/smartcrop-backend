import mongoose from "mongoose";
import User from "../models/User.js";

const run = async () => {
  // ✅ Add your MongoDB URI manually here
  const mongoURI = "mongodb+srv://l9jmpaz_db_user:Decten19@cluster0.w0lhhob.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected successfully!");

    // Fetch users
    const users = await User.find().select("username role");
    console.log("📋 Users in database:", users);

  } catch (err) {
    console.error("❌ Database connection or query error:", err);
  } finally {
    mongoose.connection.close();
  }
};

run();
