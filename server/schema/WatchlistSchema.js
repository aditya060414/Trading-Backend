const { Schema } = require("mongoose");

const WatchlistSchema = new Schema({
  email: { type: String, required: true },
  symbol: { type: String, required: true },
  high: Number,
  close: Number,
}, { timestamps: true });

WatchlistSchema.index(
  { email: 1, symbol: 1 },
  { unique: true }
);


module.exports = { WatchlistSchema };
