const { model } = require("mongoose");

const { WatchlistSchema } = require("../schema/WatchlistSchema");

const WatchlistModel = new model("watchlist", WatchlistSchema);

module.exports = { WatchlistModel };
