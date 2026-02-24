const { Schema } = require("mongoose");

const HoldingsSchema = new Schema({
  email: { type: String, required: true },
  qty: Number,
  symbol: { type: String, required: true },
  close: Number,
});

module.exports = { HoldingsSchema };
