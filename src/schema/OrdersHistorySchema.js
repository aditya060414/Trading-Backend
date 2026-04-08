// src/models/OrderHistory.js
const mongoose = require("mongoose");
const { ORDER_MODES } = require("../constants/orderConstants");

const OrderHistorySchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true,
      index: true // Fast lookup for user history
    },
    symbol: { 
      type: String, 
      required: true, 
      uppercase: true 
    },
    qty: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
    },
    price: { // Changed from 'close' to 'price' for clarity
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: { // Total cost (qty * price)
      type: Number,
      required: true
    },
    mode: {
      type: String,
      required: true,
      enum: Object.values(ORDER_MODES),
    },
  },
  { timestamps: true }
);

// Compound index: for searching a specific stock history for a specific user
OrderHistorySchema.index({ email: 1, symbol: 1 });

module.exports = { OrderHistorySchema };