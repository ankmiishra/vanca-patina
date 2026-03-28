const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const generateRefreshToken = require("../utils/generateRefreshToken");
const { sendOtpEmail } = require("../utils/emailService");
const bcrypt = require("bcryptjs");

const sendTokens = async (user, res, statusCode = 200) => {
  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token in DB for blacklist/rotating refresh tokens
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
  user.refreshTokens = user.refreshTokens.slice(-5); // keep last 5 tokens
  await user.save();

  // Optionally send refresh token as httpOnly cookie for security
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: accessToken,
    refreshToken,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error("User already exists");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.create({ name, email, password });

  await sendTokens(user, res, 201);
});

// @desc    Auth user & get tokens
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const isMatch = user ? await user.matchPassword(password) : false;

  if (!user || !isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  await sendTokens(user, res);
});

// @desc    Logout user (clear token and refreshToken references)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (refreshToken && req.user) {
    req.user.refreshTokens = (req.user.refreshTokens || []).filter((t) => t.token !== refreshToken);
    await req.user.save();
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) {
    const err = new Error("Refresh token required");
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = require("jsonwebtoken").verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 401;
    throw err;
  }

  const match = (user.refreshTokens || []).find((t) => t.token === refreshToken && new Date(t.expiresAt) > new Date());
  if (!match) {
    const err = new Error("Refresh token invalid or expired");
    err.statusCode = 401;
    throw err;
  }

  // Issue new tokens and prune old one
  user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== refreshToken);
  await user.save();

  await sendTokens(user, res);
});

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    // Create temporary user without password
    user = new User({
      email,
      name: email.split('@')[0], // Temporary name
      password: 'temp', // Will be set later
    });
  }

  // Set OTP fields
  user.otp = hashedOtp;
  user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  user.otpAttempts = 0;

  await user.save();

  // Send OTP email
  await sendOtpEmail(email, otp);

  res.json({ message: "OTP sent successfully" });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if OTP exists and not expired
  if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
    const err = new Error("OTP expired or invalid");
    err.statusCode = 400;
    throw err;
  }

  // Check attempts
  if (user.otpAttempts >= 5) {
    const err = new Error("Too many failed attempts");
    err.statusCode = 429;
    throw err;
  }

  // Verify OTP
  const isValidOtp = await bcrypt.compare(otp, user.otp);
  if (!isValidOtp) {
    user.otpAttempts += 1;
    await user.save();
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  // Clear OTP fields
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;

  // Check if user has password set
  const hasPassword = user.password && user.password !== 'temp';

  if (hasPassword) {
    // Existing user - login
    await user.save();
    await sendTokens(user, res);
  } else {
    // New user - require password setup
    await user.save();
    res.json({
      message: "OTP verified. Please set your password.",
      requiresPasswordSetup: true,
      email: user.email
    });
  }
});

// @desc    Set password for new user after OTP verification
// @route   POST /api/auth/set-password
// @access  Public
const setPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Verify OTP again (security measure)
  if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
    const err = new Error("OTP expired or invalid");
    err.statusCode = 400;
    throw err;
  }

  const isValidOtp = await bcrypt.compare(otp, user.otp);
  if (!isValidOtp) {
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  // Set password and clear OTP
  user.password = password;
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;

  await user.save();

  // Login user
  await sendTokens(user, res, 201);
});

// @desc    Admin Login (only ADMIN_EMAIL can access)
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 🔐 Verify admin email from env
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    const err = new Error("Admin email not configured");
    err.statusCode = 500;
    throw err;
  }

  if (email !== adminEmail) {
    const err = new Error("Invalid admin credentials");
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findOne({ email });
  const isMatch = user ? await user.matchPassword(password) : false;

  if (!user || !isMatch) {
    const err = new Error("Invalid admin credentials");
    err.statusCode = 401;
    throw err;
  }

  // Verify user has admin role
  if (user.role !== "admin") {
    const err = new Error("User is not an admin");
    err.statusCode = 403;
    throw err;
  }

  await sendTokens(user, res);
});

module.exports = { registerUser, authUser, logoutUser, refreshToken, sendOtp, verifyOtp, setPassword, adminLogin };

