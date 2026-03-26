const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const generateRefreshToken = require("../utils/generateRefreshToken");

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

module.exports = { registerUser, authUser, logoutUser, refreshToken };

