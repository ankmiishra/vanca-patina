const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived JWT access token.
 * role not required in token payload since middleware fetches from DB.
 */
module.exports = function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

