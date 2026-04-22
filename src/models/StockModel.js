const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  companyName: {
    type: String,
  },
  open: {
    type: Number,
  },
  high: {
    type: Number,
  },
  low: {
    type: Number,
  },
  close: {
    type: Number,
  },
  prevClose: {
    type: Number,
  },
  tradeDate: {
    type: String, // Storing as string to match incoming data format or use Date
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
stockSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const StockModel = mongoose.model("Stock", stockSchema);

module.exports = { StockModel };
