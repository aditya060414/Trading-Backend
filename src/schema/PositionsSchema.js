const { Schema } = require("mongoose");

const PositionsSchema = new Schema({
  product: String,
  instrument: String,
  qty: Number,
  avgCost: Number,
  ltp: Number,
  pnl: Number,
  chg: Number,
  isLoss: Boolean,
});

module.exports = { PositionsSchema };
