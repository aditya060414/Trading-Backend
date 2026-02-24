const { Schema } = require("mongoose");

const OrdersHistorySchema = new Schema(
  {
    symbol: { type: String, required: true },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    close: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ["BUY", "SELL"],
    },
    email: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

module.exports = { OrdersHistorySchema };
