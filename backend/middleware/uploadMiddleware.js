const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { hasCloudinary } = require('../config/cloudinary');

// ── Local disk storage (fallback when Cloudinary not configured) ─────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
  },
});

// ── Memory storage (when Cloudinary IS configured) ───────────────────────────
const memoryStorage = multer.memoryStorage();

// ── Shared file filter ────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
};

const limits = { fileSize: 10 * 1024 * 1024 }; // 10 MB

// Use memory storage when Cloudinary is available so we can stream the buffer
// directly to Cloudinary without writing to disk first.
const upload = multer({
  storage:    hasCloudinary ? memoryStorage : diskStorage,
  limits,
  fileFilter,
});

module.exports = upload;
