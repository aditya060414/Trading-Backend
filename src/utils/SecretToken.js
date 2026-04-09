require("dotenv").config();
const jwt = require("jsonwebtoken");

// console.log("JWT_SECRET:", process.env.TOKEN_KEY);
const JWT_SECRET = process.env.JWT_SECRET; 
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * Access Token: Short-lived (e.g., 15 minutes)
 * Used for authenticating every request.
 */
module.exports.generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // Include role for faster authorization
    JWT_SECRET,
    { expiresIn: "15m",
      issuer: "MarketEx",
     }
  );
};

/**
 * Refresh Token: Long-lived (e.g., 7 days)
 * Used to get a new Access Token.
 * THIS is what we will store in Redis.
 */
module.exports.generateRefreshToken = (id) => {
  return jwt.sign({ id }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
