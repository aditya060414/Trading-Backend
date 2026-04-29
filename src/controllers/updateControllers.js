const User = require("../models/UserModel");
const redisClient = require("../config/redis");

module.exports.changeUsername = async (req, res) => {
  const username = req.body.username?.trim();
  const password = req.body.password;
  const id = req.user.id;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(400).json({
        message: "User does not exist.",
      });
    }
    if (username === user.username) {
      return res.status(400).json({ message: "Username cannot be same." });
    }
    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password,
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect Password" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { username } },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User does not exist." });
    }
    // update user in redis
    await redisClient.del(`user:${user._id}`);
    await redisClient.setEx(`user:${id}`, 86400, JSON.stringify(updatedUser));
    return res.status(200).json({ message: "Username updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update username.", error: error.message });
  }
};

module.exports.changePassword = async (req, res) => {
  const newPassword = req.body.newPassword;
  const password = req.body.password;
  const id = req.user.id;

  if (!newPassword || !password) {
    return res.status(400).json({
      message: "Password is required.",
    });
  }
  if (newPassword === password) {
    return res.status(400).json({
      message: "New password cannot be same as old password.",
    });
  }
  try {
    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(400).json({
        message: "User does not exist.",
      });
    }
    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password,
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Incorrect Password.",
      });
    }

    user.password = newPassword;
    await user.save();
    await redisClient.del(`user:${user._id}`);
    const userObj = user.toObject();
    delete userObj.password;

    await redisClient.setEx(`user:${user._id}`, 86400, JSON.stringify(userObj));
    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Password update failed.",
      error: error.message,
    });
  }
};
