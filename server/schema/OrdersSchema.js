const { Schema } = require("mongoose");

const OrdersSchema = new Schema(
  {
    email: { type: String, required: true },
    symbol: { type: String, required: true },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    close: Number,
  },
  {
    timestamps: true,
  },
);

module.exports = { OrdersSchema };
