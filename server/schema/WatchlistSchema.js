const { Schema } = require("mongoose");

const WatchlistSchema = new Schema({
  name: String,
  price: Number,
  percent: Number,
  isDown: Boolean,
});

module.exports = { WatchlistSchema };
