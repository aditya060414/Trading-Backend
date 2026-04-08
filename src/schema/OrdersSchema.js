// src/models/Order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    symbol: { 
      type: String, 
      required: true, 
      uppercase: true 
    },
    qty: {
      type: Number,
      required: true,
      min: 0, // Can be 0 if we don't delete the document immediately
    },
    avgPrice: { // Renamed from 'close' - important for P&L calculations
      type: Number,
      required: true,
    },
    totalInvestment: { // Renamed from 'gross'
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

// VERY IMPORTANT: Ensures a user can't have two separate documents for the same stock.
// This makes your 'findOne' and 'updateOne' logic much safer.
OrderSchema.index({ email: 1, symbol: 1 }, { unique: true });

module.exports = { OrderSchema};