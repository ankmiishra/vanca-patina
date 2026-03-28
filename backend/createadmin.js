require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing");
      process.exit();
    }

    let user = await User.findOne({ email });

    if (user) {
      user.role = "admin";
      await user.save();
      console.log("✅ Existing user updated to admin");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name: "Admin",
        email,
        password: hashedPassword,
        role: "admin",
      });

      console.log("✅ Admin created successfully");
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit();
  }
};

createAdmin();