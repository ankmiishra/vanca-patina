const Order = require('../models/Order');
const Cart = require("../models/Cart");
const Product = require("../models/product");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  // Checkout flow: create order from the user's current cart.
  const { shippingAddress, paymentMethod } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    const err = new Error("Cart is empty");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = cart.items.map((item) => {
    return {
      product: item.product._id,
      name: item.product.name,
      qty: item.qty,
      image: item.product.image,
      price: item.product.price,
    };
  });

  const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxRate = Number(process.env.TAX_RATE || 0.05);
  const shippingPrice = itemsPrice > 2000 ? 0 : 75;
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  // Reduce stock atomically
  await Promise.all(
    cart.items.map((item) =>
      Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.qty } })
    )
  );

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    status: 'pending',
    isPaid: paymentMethod === 'COD' ? false : true,
    paidAt: paymentMethod === 'COD' ? null : new Date(),
  });

  // Clear cart after checkout.
  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  // Allow customers to access own orders and admins to access any order.
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  res.json(order);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

module.exports = { addOrderItems, getOrderById, getMyOrders };
