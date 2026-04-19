const mongoose = require("mongoose");

// Main application database
const connectDB = async () => {
  try {
    // const mongoUrl = process.env.MONGO_URL;
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL environment variable is not defined");
    }
    await mongoose.connect(mongoUrl);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = { connectDB }
