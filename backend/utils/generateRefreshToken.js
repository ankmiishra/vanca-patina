const jwt = require("jsonwebtoken");

module.exports = function generateRefreshToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};
