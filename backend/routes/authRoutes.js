const express = require('express');
const router = express.Router();
const { registerUser, authUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { registerSchema, loginSchema } = require('../validators/schemas');

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), authUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
