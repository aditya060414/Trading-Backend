const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    // import of  mongo url from environment varaibles
    const mongoUrl = process.env.MONGO_URL;
   // const mongoUrl = "mongodb://localhost:27017/marketEx";
    // if there is no url, i.e empty url then error is thrown
    if (!mongoUrl) {
      throw new Error("MONGO_URL environment variable is not defined");
    }
    // if url is present, then database connection starts
    await mongoose.connect(mongoUrl);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    // if connection fails, then error is logged and process is exited
    console.error("MongoDB connection error:", err.message);
    // when connection fails then nothing is fetched from database, so instead of showing broken server kill the process completely
    process.exit(1);
  }
};

module.exports = { connectDB }
