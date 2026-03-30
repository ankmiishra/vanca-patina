const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  // Razorpay case (handled separately)
  if (paymentMethod === "Razorpay") {
    const err = new Error("Use payment endpoints for Razorpay");
    err.statusCode = 400;
    throw err;
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || !cart.items.length) {
    const err = new Error("Cart is empty");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    qty: item.qty,
    image: item.product.image,
    price: item.product.price,
  }));

  const itemsPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const taxRate = Number(process.env.TAX_RATE || 0.05);
  const shippingPrice = itemsPrice > 2000 ? 0 : 75;
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  const totalPrice = Number(
    (itemsPrice + shippingPrice + taxPrice).toFixed(2)
  );

  // ✅ START TRANSACTION
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔐 STOCK CHECK + UPDATE (SAFE)
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(
        session
      );

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < item.qty) {
        throw new Error(`${product.name} is out of stock`);
      }

      product.stock -= item.qty;
      await product.save({ session });
    }

    // 🧾 CREATE ORDER (use .save() so pre('save') hook fires for orderId)
    const newOrder = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      status: paymentMethod === "COD" ? "pending" : "processing",
      isPaid: paymentMethod === "COD" ? false : true,
      paidAt: paymentMethod === "COD" ? null : new Date(),
    });
    const createdOrder = await newOrder.save({ session });

    // 🛒 CLEAR CART
    cart.items = [];
    await cart.save({ session });

    // ✅ COMMIT
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(createdOrder);
  } catch (error) {
    // ❌ ROLLBACK
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      message: error.message || "Order failed",
    });
  }
});

// @desc    Get order by id
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  // Ensure user can only see their own orders
  if (order.user._id.toString() !== req.user._id.toString()) {
    const err = new Error('Not authorized to view this order');
    err.statusCode = 403;
    throw err;
  }

  res.json(order);
});

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

module.exports = { addOrderItems, getOrderById, getMyOrders };