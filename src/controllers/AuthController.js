const User = require("../models/UserModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/SecretToken");
const redisClient = require('../config/redis');
const jwt = require("jsonwebtoken");

// Helper to set session in Redis
const cacheUserSession = async (user) => {
  const userData = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  // Store user in Redis for 24 hours (matching your cookie maxAge)
  await redisClient.setEx(`user:${user._id}`, 86400, JSON.stringify(userData));
  return userData;
};


module.exports.SignUp = async (req, res) => {
  try {
    const { email, password, username, contact } = req.body;

    // 1. Check if user already exists
    const existingUSer = await User.findOne({ email });
    
    if (existingUSer) {
      return res.status(409).json({ message: "User already exists" });
    }
    
    // 2. Create User
    const user = await User.create({
      username,
      email,
      password,
      contact,
    });
    
    console.log(email,password,username,contact);
    // 3. Cache the new user in Redis immediately
    const cachedData = await cacheUserSession(user);

    // 4. Generate Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);
    // Store Refresh Token in Redis
    await redisClient.setEx(`refresh:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

    // 5. Set Cookie
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "Lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

     res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/api/v1/auth/refresh", // Security: Only send this cookie to the /refresh endpoint
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });


    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: cachedData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //  Check if all fields are required
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }


    // 1. Find user and explicitly select password (because we set select: false in schema)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      // 2. Security: Use of generic message so that the attacker does not know exactly what is wrong.
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    // 3. Using the method created in the Mongoose Schema
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Cache User Data in Redis
    const cachedData = await cacheUserSession(user);

    // 5. Token and Cookie
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id);
    // Store Refresh Token in Redis
    await redisClient.setEx(`refresh:${user._id}`, 7 * 24 * 60 * 60, refreshToken);
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 15 * 60 * 1000, //15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/api/v1/auth/refresh", // Security: Only send this cookie to the /refresh endpoint
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: cachedData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports.Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken); // Just decode to get ID
        if (decoded && decoded.id) {
          await redisClient.del(`refresh:${decoded.id}`); // Kill the session in Redis
          await redisClient.del(`user:${decoded.id}`);    // Kill the user data cache
        }
      } catch (decodeErr) {
        console.error("Token decode error during logout:", decodeErr);
      }
    }

    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });

    res.status(200).json({ message: "Logged out from all devices" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};

module.exports.RefreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ message: "Refresh Token required" });

  try {
    // 1. Verify the token structure/signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. Check if this exact token exists in Redis for this user
    const savedToken = await redisClient.get(`refresh:${decoded.id}`);

    if (!savedToken || savedToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    // 3. Get user details for the new Access Token (we need the role)
    let userData = await redisClient.get(`user:${decoded.id}`);
    
    if (userData) {
      userData = JSON.parse(userData);
      // Map 'id' back to '_id' if necessary for generateAccessToken
      if (userData.id && !userData._id) userData._id = userData.id;
    } else {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      userData = user;
    }

    // 4. Generate a NEW Access Token
    const newAccessToken = generateAccessToken(userData);

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(403).json({ message: "Invalid Refresh Token" });
  }
};
