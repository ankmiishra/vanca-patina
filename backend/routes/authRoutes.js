const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { registerUser, authUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { registerSchema, loginSchema } = require('../validators/schemas');

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

router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), authUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
