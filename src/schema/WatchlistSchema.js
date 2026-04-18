const { Schema } = require("mongoose");

const WatchlistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  high: { type: Number, default: 0 },
  low: { type: Number, default: 0 },
  close: { type: Number, default: 0 },
}, { timestamps: true });

WatchlistSchema.index(
  { userId: 1, symbol: 1 },
  { unique: true }
);


module.exports = { WatchlistSchema };
