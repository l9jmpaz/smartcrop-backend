// seedUsers.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI;

// 20 allowed crops
const CROPS = [
  "Bell Pepper", "Bitter Gourd", "Broccoli", "Cabbage", "Carrot",
  "Cassava", "Celery", "Chayote", "Eggplant", "Lettuce",
  "Okra", "Squash", "Tomato", "Corn", "Rice",
  "Onion", "Garlic", "Mungbean", "Peanut", "Sweet Potato"
];

const BARANGAYS = [
  "Ambulong","Bagbag","Bagumbayan","Balele","Banjo East","Banjo West",
  "Banadero","Bilogbilog","Boot","Cale","Darasa","Gonzales","Hidalgo",
  "Janopol Oriental","Janopol Occidental","Laurel","Luyos","Mabini",
  "Malaking Pulo","Maria Paz","Maugat","Montaña","Natatas","Pagaspas",
  "Pantay Bata","Pantay Matanda","Sala","Sambat","San Jose","Santol",
  "Santor","Suplang","Sulpoc","Tinurik","Trapiche","Ulango","Wawa","Poblacion 1",
  "Poblacion 2","Poblacion 3","Poblacion 4","Poblacion 5","Poblacion 6","Poblacion 7"
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  await User.deleteMany({});
  await Farm.deleteMany({});
  console.log("Cleared User + Farm collections");

  const hashed = await bcrypt.hash("Password123", 10);

  let users = [];

  for (let i = 0; i < 109; i++) {
    const username = `User${i + 1}`;
    const phone = `09${Math.floor(100000000 + Math.random() * 899999999)}`;
    const email = `user${i + 1}@mail.com`;

    const user = await User.create({
      username,
      email,
      phone,
      password: hashed,
      barangay: randomFrom(BARANGAYS),
      barangayResidencyCert: "/uploads/user_documents/fake_cert.jpg",
      validId: "/uploads/user_documents/fake_id.jpg",
      role: "user",
      status: "Active",
      isBanned: false,
    });

    const farmCount = Math.floor(Math.random() * 3) + 1; // 1–3 farms

    for (let f = 0; f < farmCount; f++) {
      const crop = randomFrom(CROPS);

      const completedAt = randomDate(
        new Date(2023, 0, 1),
        new Date(2025, 11, 31)
      );

      const kilos = Math.floor(Math.random() * 490) + 10; // 10–500 kg

      await Farm.create({
        userId: user._id,
        fieldName:`Field ${f + 1}`,
        soilType: "Loam",
        wateringMethod: "Manual",
        fieldSize: Math.floor(Math.random() * 5) + 1,
        selectedCrop: crop,
        archived: true,
        completedAt,
        tasks: [
          {
            type: "Harvesting",
            crop,
            date: completedAt,
            completed: true,
            kilos,
          },
        ],
      });
    }

    users.push(user.username);
  }

  console.log(`Seeded ${users.length} users successfully.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});