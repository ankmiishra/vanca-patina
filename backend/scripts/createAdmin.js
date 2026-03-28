#!/usr/bin/env node
/**
 * Create Admin User Script
 * Usage: node scripts/createAdmin.js
 * 
 * This script creates the first admin user in the MongoDB database.
 * The admin email must match ADMIN_EMAIL from .env file.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Check if ADMIN_EMAIL is configured
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
      console.error('❌ ADMIN_EMAIL not set in .env file');
      process.exit(1);
    }

    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD not set in .env file');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vanca');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
        console.log(`Role: ${existingAdmin.role}`);
        console.log(`Created: ${existingAdmin.createdAt}`);
        process.exit(0);
      } else {
        console.log(`⚠️  User exists with email ${adminEmail} but role is ${existingAdmin.role}`);
        console.log('Updating role to admin...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ User upgraded to admin role');
        process.exit(0);
      }
    }

    // Create admin user
    console.log(`\n📝 Creating admin user...`);
    console.log(`Email: ${adminEmail}`);

    const admin = await User.create({
      name: 'Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: '+1 (555) 000-0000',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`ID: ${admin._id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Created: ${admin.createdAt}`);

    console.log('\n🔐 You can now login to the admin panel:');
    console.log(`URL: http://localhost:8081/admin/login`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   User with this email already exists');
    }
    process.exit(1);
  }
};

createAdmin();
