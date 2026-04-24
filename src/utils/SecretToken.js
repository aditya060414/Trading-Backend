require("dotenv").config();
const jwt = require("jsonwebtoken");


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined in environment variables");
}
/**
 * Access Token: Short-lived (e.g., 15 minutes)
 * Used for authenticating every request.
 */
module.exports.generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // Include role for faster authorization
    JWT_SECRET,
    {
      expiresIn: "30m",
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
    issuer: "MarketEx",
  });
};
