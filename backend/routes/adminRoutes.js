const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getCategories,
  updateCategory,
  deleteCategory,
  getAllUsers,
  getUserById,
  deleteUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const {
  updateOrderStatusSchema,
  idParamSchema,
  createProductSchema,
  updateProductSchema,
} = require('../validators/schemas');

// ==================== DASHBOARD ====================
router.route('/stats')
  .get(protect, admin, getDashboardStats);

// ==================== ORDERS ====================
router.route('/orders')
  .get(protect, admin, getAllOrders);

router.route('/orders/:id')
  .put(
    protect,
    admin,
    validate(idParamSchema, 'params'),
    validate(updateOrderStatusSchema),
    updateOrderStatus
  );

// ==================== PRODUCTS ====================
router.route('/products')
  .get(protect, admin, getAdminProducts)
  .post(protect, admin, validate(createProductSchema), createProduct);

router.route('/products/:id')
  .put(
    protect,
    admin,
    validate(idParamSchema, 'params'),
    validate(updateProductSchema),
    updateProduct
  )
  .delete(protect, admin, validate(idParamSchema, 'params'), deleteProduct);

// ==================== CATEGORIES ====================
router.route('/categories')
  .get(protect, admin, getCategories)
  .put(protect, admin, updateCategory);

router.route('/categories/:category')
  .delete(protect, admin, deleteCategory);

// ==================== USERS ====================
router.route('/users')
  .get(protect, admin, getAllUsers);

router.route('/users/:id')
  .get(protect, admin, validate(idParamSchema, 'params'), getUserById)
  .delete(protect, admin, validate(idParamSchema, 'params'), deleteUser);

module.exports = router;
