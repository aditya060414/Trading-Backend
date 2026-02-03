const { Schema } = require("mongoose");

const HoldingsSchema = new Schema({
  instrument: String,
  qty: Number,
  avgCost: Number,
  ltp: Number,
  curVal: Number,
  pnl: Number,
  netChg: Number,
  dayChg: Number,
});

module.exports = { HoldingsSchema };
