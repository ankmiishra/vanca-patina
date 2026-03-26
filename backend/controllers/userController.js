const User = require('../models/User');
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

// Auth endpoints moved to `controllers/authController.js`

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  user.name = req.body.name ?? user.name;
  user.email = req.body.email ?? user.email;
  if (req.body.password) user.password = req.body.password;

  const updatedUser = await user.save();
  res.json({
    _id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    token: generateToken(updatedUser.id),
  });
});

module.exports = { getUserProfile, updateUserProfile };
