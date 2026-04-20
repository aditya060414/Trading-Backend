const mongoose = require("mongoose");
const { Schema } = mongoose;

// 1. Transaction Ledger (For History)
const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ["ADD", "WITHDRAW", "ORDER_DEBIT", "ORDER_CREDIT", "BUY", "SELL"],
    required: true
  },
  orderId: { type: String, unique: true },
  amount: {
    type: Number,
    required: true,
    set: v => parseFloat(v.toFixed(2))
  },
  symbol: { type: String, default: null },
  status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
  referenceId: { type: String }, // External ID (e.g., phonepe/UPI ID)
  balanceBefore: { type: Number, set: v => parseFloat(v.toFixed(2)) },
  balanceAfter: { type: Number, set: v => parseFloat(v.toFixed(2)) },
  reason: { type: String, default: null },
}, { timestamps: true });

// 2. Wallet Schema (For Current Balance)
const walletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: {
    type: Number,
    default: 0,
    min: [0, "Balance cannot be negative"], // Security: Prevent balance from dropping below 0
    set: v => parseFloat(v.toFixed(2))
  },
}, {
  timestamps: true,
  toJSON: { getters: true }, // Ensures getters run when sending JSON to frontend
  toObject: { getters: true }
});

const Transaction = mongoose.model("Transaction", transactionSchema);
const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = { Transaction, Wallet };