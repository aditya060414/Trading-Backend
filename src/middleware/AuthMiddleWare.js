const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis")


module.exports.userVerification = async (req, res,next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id;

    // 1. Try to get user data from Redis first
    const cachedUser = await redisClient.get(`user:${userId}`);

    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      return next();
    }

    // 2. If not in Redis, hit MongoDB
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ authenticated: false, message: "User not found" });
    }

    // 3. Store in Redis for future requests (Expire in 30 mins)
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    await redisClient.setEx(
      `user:${userId}`,
      86400, // 24 hours
      JSON.stringify(userData)
    );

    // res.status(200).json({
    //   authenticated: true,
    //   user: userData,
    //   source: "database"
    // });

     req.user = userData;
     next();

  } catch (err) {
    return res.status(401).json({ authenticated: false, message: "Invalid Token" });
  }
};


