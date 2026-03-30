const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }
  res.json(wishlist.products);
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    const err = new Error('productId is required');
    err.statusCode = 400;
    throw err;
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate('products');
  res.json(wishlist.products);
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    return res.json([]);
  }

  wishlist.products = wishlist.products.filter(
    (p) => p.toString() !== req.params.productId
  );
  await wishlist.save();
  await wishlist.populate('products');
  res.json(wishlist.products);
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
