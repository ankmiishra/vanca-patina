const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { updateProfileSchema } = require('../validators/schemas');

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validate(updateProfileSchema), updateUserProfile);

module.exports = router;
