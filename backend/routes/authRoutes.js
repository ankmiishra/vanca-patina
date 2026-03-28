const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { registerUser, authUser, logoutUser, refreshToken, sendOtp, verifyOtp, setPassword, adminLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { registerSchema, loginSchema, sendOtpSchema, verifyOtpSchema, setPasswordSchema } = require('../validators/schemas');

// Rate limit for login attempts (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for registration (10 attempts per hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for OTP send (3 attempts per hour)
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for OTP verification (5 attempts per 5 minutes)
const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many OTP verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), authUser);
router.post('/admin-login', loginLimiter, validate(loginSchema), adminLogin);
router.post('/logout', protect, logoutUser);
router.post('/refresh', refreshToken);

// OTP-based authentication routes
router.post('/send-otp', otpSendLimiter, validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', otpVerifyLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/set-password', validate(setPasswordSchema), setPassword);

module.exports = router;
