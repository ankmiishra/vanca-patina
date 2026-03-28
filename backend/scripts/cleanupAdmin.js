#!/usr/bin/env node
/**
 * Cleanup Admin user and optionally all users.
 * Usage:
 *   node scripts/cleanupAdmin.js [all]
 *
 * If you pass `all`, all users are deleted.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vanca_patina';
    console.log('Connecting to MongoDB:', uri);
    await mongoose.connect(uri);

    const deleteAll = process.argv.includes('all');
    if (deleteAll) {
      const del = await User.deleteMany({});
      console.log(`Deleted ${del.deletedCount} users from database.`);
    } else {
      const email = 'admin@vancapatina.com';
      const del = await User.deleteOne({ email });
      console.log(`Deleted admin account ${email}: ${del.deletedCount} document(s) removed.`);
      console.log('If you also want to remove all credentials, rerun with `all` argument.');
    }

    await mongoose.disconnect();
    console.log('Completed cleanup.');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  }
})();