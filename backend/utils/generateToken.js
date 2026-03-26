const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived JWT access token.
 * Note: role is not required in token payload since middleware can fetch it from DB.
 */
module.exports = function generateToken(id) {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

