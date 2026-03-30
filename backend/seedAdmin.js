/**
 * Seed (or re-seed) the admin account.
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD from .env
 *
 * Run:  node seedAdmin.js
 */
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const User = require("./models/User");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected for seeding admin...");

    // Remove any existing admin with this email so we get a fresh, properly-hashed password
    await User.deleteOne({ email: ADMIN_EMAIL });
    console.log(`Cleared old admin record for ${ADMIN_EMAIL} (if any)`);

    // Create() calls save() once → pre('save') hashes the password exactly once ✅
    await User.create({
      name: "Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      isVerified: true,
    });

    console.log(`✅ Admin account seeded!`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: (from .env ADMIN_PASSWORD)`);
    console.log(`   Login at: http://localhost:8080/admin`);

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
