const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/product');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');

// Initialize Razorpay only if keys are available
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  if (!razorpay) {
    const err = new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    err.statusCode = 500;
    throw err;
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    const err = new Error('Cart is empty');
    err.statusCode = 400;
    throw err;
  }

  // Calculate total on backend (don't trust frontend)
  const itemsPrice = cart.items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const taxRate = Number(process.env.TAX_RATE || 0.05);
  const shippingPrice = itemsPrice > 2000 ? 0 : 75;
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  // Create Razorpay order
  const options = {
    amount: Math.round(totalPrice * 100), // Amount in paisa
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  res.json({
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  if (!razorpay) {
    const err = new Error('Razorpay is not configured');
    err.statusCode = 500;
    throw err;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

  // Verify signature
  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature !== expectedSign) {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }

  // Payment verified, now create/update order
  const { shippingAddress } = orderData;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    const err = new Error('Cart is empty');
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

  // Create order with payment details
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod: 'Razorpay',
    paymentResult: {
      id: razorpay_payment_id,
      status: 'completed',
      update_time: new Date().toISOString(),
      email_address: req.user.email,
    },
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: true,
    paidAt: new Date(),
    status: 'processing',
  });

  // Clear cart
  cart.items = [];
  await cart.save();

  res.json({
    success: true,
    orderId: order._id,
    message: 'Payment verified and order created successfully',
  });
});

module.exports = { createOrder, verifyPayment };