const { Schema } = require("mongoose");

const HoldingsSchema = new Schema({
  email: { type: String, required: true },

  symbol: { type: String, required: true },

  qty: {
    type: Number,
    default: 0,
  },

  avgPrice: {
    type: Number,
    default: 0,
  },

  invested: {
    type: Number,
    default: 0,
  },
});

module.exports = { HoldingsSchema };