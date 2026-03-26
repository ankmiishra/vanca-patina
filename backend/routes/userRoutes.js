const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { updateProfileSchema, addressSchema } = require('../validators/schemas');

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validate(updateProfileSchema), updateUserProfile);

router.route('/addresses')
  .get(protect, getUserAddresses)
  .post(protect, validate(addressSchema), addUserAddress);

router.route('/addresses/:addressId')
  .put(protect, validate(addressSchema), updateUserAddress)
  .delete(protect, deleteUserAddress);

module.exports = router;
