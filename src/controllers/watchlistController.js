const { WatchlistModel } = require("../models/WatchlistModel")
const { fetchStock, getStockCache } = require("./PortfolioController");

module.exports.getWatchlist = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized request."
        });
    }
    try {
        const watchlistItems = await WatchlistModel.find({ userId });
        if (!watchlistItems.length) {
            return res.status(200).json({
                stock: [],
                message: "No stock found in watchlist."
            })
        }
        let latestData = getStockCache();
        if (latestData.length === 0) {
            await fetchStock();
            latestData = getStockCache();
        }
        const updatedWatchlist = watchlistItems.map((item) => {
            const dbSymbol = item.symbol.trim().toUpperCase();

            // Find match in cache (handling potential .NS suffix)
            const marketInfo = latestData.find(s => {
                const cacheSym = s.symbol.trim().toUpperCase();
                return cacheSym === dbSymbol || cacheSym === `${dbSymbol}.NS`;
            });
            return {
                _id: item._id,
                symbol: item.symbol,
                open: marketInfo ? marketInfo.open : item.open,
                high: marketInfo ? marketInfo.high : item.high,
                low: marketInfo ? marketInfo.low : item.low,
                close: marketInfo ? marketInfo.close : item.close,
                prevClose: marketInfo ? marketInfo.prevClose : item.close,
                change: marketInfo ? (marketInfo.close - marketInfo.prevClose).toFixed(2) : 0,
            };
        });

        return res.status(200).json({
            stock: updatedWatchlist,
            message: "Watchlist fetched with latest prices",
        });

    } catch (error) {
        console.error("Watchlist Fetch Error:", error.message);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.addToWatchlist = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized request."
        });
    }

    const { symbol, high, close, low, open } = req.body;
    if (!symbol || !high || !close || !open || !low) {
        return res.status(400).json({
            message: "Symbol, high, open, low and close are required."
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
            open,
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

module.exports.removeStock = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized request."
        });
    }
    const { symbol } = req.body;
    if (!symbol) {
        return res.status(400).json({
            message: "Symbol is missing."
        })
    }
    try {
        const stock = await WatchlistModel.findOne({ userId, symbol })
        if (!stock) {
            return res.status(404).json({
                message: "Stock not found in watchlist."
            })
        }
        await WatchlistModel.deleteOne({ userId, symbol })
        return res.status(200).json({
            message: "Stock removed from watchlist successfully."
        })
    } catch (error) {
        console.error("Error in removeStock:", error)
        return res.status(500).json({
            message: "Internal server error."
        })
    }
}