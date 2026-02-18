const User = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

module.exports.SignUp = async (req, res, next) => {
  try {
    const { email, password, username, contact, createdAt } = req.body;
    const existingUSer = await User.findOne({ email });

    if (existingUSer) {
      return res.status(409).json({ message: "User already exists" });
    }
    const user = await User.create({
      username,
      email,
      password,
      contact,
      createdAt,
    });

    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });
    res.status(201).json({
      message: "User signed in successfully",
      success: true,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports.Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ message: "all the fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Email is incorrect" });
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.json({ message: "Password is incorrect" });
    }
    const token = createSecretToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path:"/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports.Logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false, 
    path:"/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
