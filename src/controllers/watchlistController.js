const { WatchlistModel } = require("../models/WatchlistModel")

module.exports.getWatchlist = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized request."
        });
    }
    try {
        const stock = await WatchlistModel.find({ userId });
        if (!stock) {
            return res.status(200).json({
                stock: [],
                message: "No stock found in watchlist."
            })
        }
        return res.status(200).json({
            stock: stock,
            message: "Stock fetched successfully",
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: "Internal server error."
        })
    }
}

module.exports.addToWatchlist = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized request."
        });
    }

    const { symbol, high, close, low } = req.body;
    if (!symbol || !high || !close) {
        return res.status(400).json({
            message: "Symbol, high, and close are required."
        });
    }

    try {
        const existingStock = await WatchlistModel.findOne({ userId, symbol })
        if (existingStock) {
            return res.status(400).json({
                message: "Stock already exists in watchlist."
            })
        }
        const setStock = await WatchlistModel.create({
            userId,
            symbol,
            high,
            close,
            low
        });

        return res.status(201).json({
            message: "Stock added to watchlist successfully.",
            stock: setStock
        })
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: "Internal server error."
        })
    }

}