const { Schema } = require("mongoose");

const FundsHistorySchema = new Schema(
  {
    email: { type: String, required: true },
    transaction: {
      type: String,
      required: true,
      enum: ["Deposit", "Withdraw"],
    },
    amount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);
module.exports = { FundsHistorySchema };
