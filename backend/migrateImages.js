/**
 * migrateImages.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrates all product images to Cloudinary.
 *
 * Handles three cases:
 *   1. External HTTP/HTTPS URLs  → downloads buffer, uploads to Cloudinary
 *   2. Local /uploads/ paths     → reads file from disk, uploads to Cloudinary
 *   3. Already Cloudinary URLs   → skips (no work needed)
 *
 * Usage:
 *   node migrateImages.js
 *
 * Safe to re-run — skips images that are already on Cloudinary.
 * ─────────────────────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const http     = require('http');

const Product = require('./models/product');
const { hasCloudinary, uploadToCloudinary } = require('./config/cloudinary');

const uploadDir = path.join(__dirname, 'uploads');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Download a URL into a Buffer */
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/** Upload a URL or local path to Cloudinary, return secure_url */
async function migrateUrl(url, publicId) {
  // Already on Cloudinary — nothing to do
  if (url && url.includes('cloudinary.com')) return url;

  let buffer;

  if (url && url.startsWith('http')) {
    console.log(`  ↓ Downloading: ${url}`);
    buffer = await downloadBuffer(url);
  } else if (url && url.startsWith('/uploads/')) {
    const localPath = path.join(uploadDir, path.basename(url));
    if (!fs.existsSync(localPath)) {
      console.warn(`  ⚠️  Local file not found, skipping: ${localPath}`);
      return url; // keep existing value
    }
    console.log(`  📂 Reading local: ${localPath}`);
    buffer = fs.readFileSync(localPath);
  } else {
    console.warn(`  ⚠️  Unrecognised URL format, skipping: ${url}`);
    return url;
  }

  const result = await uploadToCloudinary(buffer, { public_id: publicId });
  console.log(`  ✅ Uploaded → ${result.secure_url}`);
  return result.secure_url;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function migrateImages() {
  if (!hasCloudinary) {
    console.error('❌ Cloudinary is NOT configured. Please set env vars and retry.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  const products = await Product.find({});
  console.log(`Found ${products.length} products to check...\n`);

  let updatedCount = 0;

  for (const product of products) {
    let needsUpdate = false;
    console.log(`📦 [${product.name}]`);

    // ── single image ─────────────────────────────────────────────────────────
    if (product.image && !product.image.includes('cloudinary.com')) {
      try {
        const newUrl = await migrateUrl(
          product.image,
          `vanca-patina/products/product-${product._id}-main`
        );
        if (newUrl !== product.image) {
          product.image = newUrl;
          needsUpdate = true;
        }
      } catch (err) {
        console.error(`  ❌ Failed (main image): ${err.message}`);
      }
    } else {
      console.log('  ✔ Main image already on Cloudinary');
    }

    // ── images array ─────────────────────────────────────────────────────────
    if (Array.isArray(product.images) && product.images.length > 0) {
      for (let i = 0; i < product.images.length; i++) {
        const imgUrl = product.images[i];
        if (imgUrl && !imgUrl.includes('cloudinary.com')) {
          try {
            const newUrl = await migrateUrl(
              imgUrl,
              `vanca-patina/products/product-${product._id}-img${i}`
            );
            if (newUrl !== imgUrl) {
              product.images[i] = newUrl;
              needsUpdate = true;
            }
          } catch (err) {
            console.error(`  ❌ Failed (images[${i}]): ${err.message}`);
          }
        }
      }
    }

    if (needsUpdate) {
      product.markModified('images');
      await product.save();
      updatedCount++;
      console.log(`  💾 Saved\n`);
    } else {
      console.log(`  — No changes\n`);
    }
  }

  console.log(`\n🎉 Migration complete! Updated ${updatedCount} / ${products.length} products.`);
  await mongoose.disconnect();
  process.exit(0);
}

migrateImages().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
