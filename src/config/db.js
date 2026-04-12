const mongoose = require("mongoose");

// Main application database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Secondary Stock database
const stockDB = mongoose.createConnection(process.env.STOCKDB);

stockDB.on("connected", () => {
  console.log("Stock Database Connected");
});

stockDB.on("error", (err) => {
  console.error("Stock DB error:", err.message);
});

module.exports = { connectDB, stockDB };
