const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis")


module.exports.userVerification = async (req, res,next) => {
  // request cookie stored on the browser frontend of the user, if logged in there will be cookie stored
  const token = req.cookies.token;
  // no cookie or invalid
  if (!token) {
    return res.status(401).json({ status: false, message: "Login again to continue!" });
  }

  try {
    // use of inbuilt verify function of JSON Web Token to verify the token, which return the decoded data if valid 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userId = decoded.id;

    // if no user id in decoded data
    if(!userId){
      return res.status(401).json({ status: false, message: "Login again to continue!" });
    }

    // 1. Trying to get user data from Redis first
    const cachedUser = await redisClient.get(`user:${userId}`);

    if (cachedUser) {
      // parse data in JSON format to transfer the data from redis to controller file
      req.user = JSON.parse(cachedUser);
      return next();
    }

    // 2. If not in Redis, hit MongoDB
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ authenticated: false, message: "User not found" });
    }

    // 3. Store in Redis for future requests 
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

     req.user = userData;
     next();

  } catch (err) {
    return res.status(401).json({ authenticated: false, message: "Invalid Token" });
  }
};


