const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Build the standard auth response payload.
 * Called after every successful login / register to keep the shape consistent.
 */
const buildAuthResponse = (user, accessToken, refreshToken) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  accessToken,
  refreshToken,
});

// ─── Register ─────────────────────────────────────────────────────────────────

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error('User already exists');
    err.statusCode = 409;
    throw err;
  }

  // User.create() calls save() internally → pre('save') hashes the password.
  // We set isVerified:true so the user can log in immediately (no OTP required).
  const user = await User.create({
    name,
    email,
    password,
    isVerified: true,
  });

  // Generate tokens — do NOT call user.save() again here because the
  // pre('save') hook would re-hash the already-hashed password, making
  // every future login fail with "Invalid email or password".
  const accessToken = generateAccessToken(user._id);
  const refreshTokenVal = generateRefreshToken(user._id);

  // Store refresh token directly via updateOne to avoid triggering pre('save')
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          token: refreshTokenVal,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
    }
  );

  res.status(201).json(buildAuthResponse(user, accessToken, refreshTokenVal));
});

// ─── Login ────────────────────────────────────────────────────────────────────

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('[AUTH] Login attempt for:', email);

  const user = await User.findOne({ email });

  if (!user) {
    console.log('[AUTH] No user found with email:', email);
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.matchPassword(password);
  console.log('[AUTH] Password match result:', isMatch);

  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (user.isBlocked) {
    const err = new Error('Account is blocked');
    err.statusCode = 403;
    throw err;
  }

  const accessToken = generateAccessToken(user._id);
  const refreshTokenVal = generateRefreshToken(user._id);

  // Prune expired tokens + store new one
  // Use updateOne to avoid re-triggering the password hash pre('save') hook.
  await User.updateOne(
    { _id: user._id },
    {
      $pull: { refreshTokens: { expiresAt: { $lte: new Date() } } },
    }
  );
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          token: refreshTokenVal,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
    }
  );

  console.log('[AUTH] Login successful for:', email);
  res.json(buildAuthResponse(user, accessToken, refreshTokenVal));
});

// ─── Admin Login ──────────────────────────────────────────────────────────────

// @desc    Authenticate admin user & get token
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  if (user.role !== 'admin') {
    const err = new Error('Access denied: admins only');
    err.statusCode = 403;
    throw err;
  }

  if (user.isBlocked) {
    const err = new Error('Account is blocked');
    err.statusCode = 403;
    throw err;
  }

  const accessToken = generateAccessToken(user._id);
  const refreshTokenVal = generateRefreshToken(user._id);

  await User.updateOne(
    { _id: user._id },
    { $pull: { refreshTokens: { expiresAt: { $lte: new Date() } } } }
  );
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          token: refreshTokenVal,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
    }
  );

  res.json(buildAuthResponse(user, accessToken, refreshTokenVal));
});

// ─── Logout ───────────────────────────────────────────────────────────────────

// @desc    Logout user (invalidate refresh token)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }

  res.json({ message: 'Logged out successfully' });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

// @desc    Issue new access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    const err = new Error('Refresh token required');
    err.statusCode = 400;
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  const storedToken = user.refreshTokens.find(
    (t) => t.token === token && t.expiresAt > new Date()
  );
  if (!storedToken) {
    const err = new Error('Refresh token not recognised or expired');
    err.statusCode = 401;
    throw err;
  }

  // Rotate: remove old, add new  — use updateOne to avoid pre('save')
  const newRefreshToken = generateRefreshToken(user._id);
  await User.updateOne(
    { _id: user._id },
    {
      $pull: { refreshTokens: { token } },
    }
  );
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
    }
  );

  res.json({
    accessToken: generateAccessToken(user._id),
    refreshToken: newRefreshToken,
  });
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  registerUser,
  authUser,
  logoutUser,
  refreshToken,
  adminLogin,
};
