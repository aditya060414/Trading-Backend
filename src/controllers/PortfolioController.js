const { OrdersModel } = require("../models/OrdersModel.js");
const axios = require('axios')

let stockCache = [];

const fetchStock = async () => {
    try {
        const res = await axios.get("https://nse-stock-data-api.onrender.com/api/stocks");

        if (!res.data || !Array.isArray(res.data)) {
            console.error("API ERROR: Data is not an array!", res.data);
            return;
        }

        stockCache = res.data;
        console.log("SUCCESS: Stock cache populated with", stockCache.length, "items.");

    } catch (error) {
        console.error("Critical Fetch Error:", error.message);
    }
}

const getPortfolio = async (req, res) => {
    const { id } = req.params;

    try {

        if (stockCache.length === 0) {
            console.log("Cache empty, attempting emergency fetch...");
            await fetchStock();
        }

        const holdings = await OrdersModel.find({ userId: id });

        if (!holdings.length) {
            return res.json({
                portfolioValue: 0,
                investedAmount: 0,
                todaysGain: 0,
                allocation: [],
            });
        }

        const dbSymbols = holdings.map((h) => h.symbol.trim().toUpperCase());

        const relevantStocks = stockCache.filter((cacheStock) => {
            if (!cacheStock.symbol) return false;
            const cacheSym = cacheStock.symbol.trim().toUpperCase();

            return dbSymbols.some(dbSym => cacheSym === dbSym || cacheSym.startsWith(dbSym + "."));
        });
        if (relevantStocks.length > 0) {
            [...new Set(relevantStocks.map(s => s.symbol))];
        }

        if (!relevantStocks.length) {
            console.warn("Live API failed, using DB-only fallback");

            let portfolioValue = 0;
            let investedAmount = 0;

            const allocation = holdings.map(h => {
                const value = h.totalInvestment;

                portfolioValue += value;
                investedAmount += value;

                return {
                    symbol: h.symbol,
                    qty: h.qty,
                    avgPrice: h.avgPrice,
                    currPrice: h.avgPrice,
                    totalInvestment: h.totalInvestment,
                    currentValue: value,
                    dailyGain: 0,
                    totalGain: 0,
                    mode: h.mode
                };
            });

            return res.json({
                portfolioValue,
                investedAmount,
                todaysGain: 0,
                allocation,
                message: "Live prices unavailable. Showing static values."
            });
        }

        const holdingsMap = Object.fromEntries(
            holdings.map((h) => [h.symbol.trim().toUpperCase(), h])
        );

        const uniqueDates = [
            ...new Set(relevantStocks.map((s) => s.tradeDate)),
        ].sort((a, b) => new Date(b) - new Date(a));

        const latestDate = uniqueDates[0];
        const prevDate = uniqueDates[1];

        const todayStocks = relevantStocks.filter(
            (s) => s.tradeDate === latestDate
        );

        const prevStocks = prevDate
            ? relevantStocks.filter((s) => s.tradeDate === prevDate)
            : [];

        const prevMap = Object.fromEntries(
            prevStocks.map((s) => [s.symbol, s.close])
        );

        let portfolioValue = 0;
        let investedAmount = 0;
        let todaysGain = 0;

        let allocation = [];
        let topGainer = { symbol: "", gain: -Infinity };

        todayStocks.forEach((stock) => {
            const holding = holdingsMap[stock.symbol.trim().toUpperCase()];

            if (!holding) return;

            const qty = holding.qty;
            const currentPrice = stock.close;
            const prevPrice = prevMap[stock.symbol] || currentPrice;

            const currentValue = qty * currentPrice;
            const investedAmountForThisStock = holding.totalInvestment;

            // Calculations
            const dailyGain = (currentPrice - prevPrice) * qty;
            const totalGain = currentValue - investedAmountForThisStock;

            portfolioValue += currentValue;
            investedAmount += investedAmountForThisStock;
            todaysGain += dailyGain;

            allocation.push({
                symbol: stock.symbol,
                qty: qty,
                avgPrice: holding.avgPrice,
                currPrice: currentPrice,
                totalInvestment: investedAmountForThisStock,
                currentValue: currentValue,
                dailyGain: dailyGain,
                totalGain: totalGain,
                mode: holding.mode
            });

            if (dailyGain > topGainer.gain) {
                topGainer = { symbol: stock.symbol, gain: dailyGain };
            }
        });

        res.json({
            portfolioValue,
            investedAmount,
            todaysGain,
            topGainer,
            allocation,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Analytics error" });
    }
}

const getStockCache = () => stockCache;
module.exports = { getPortfolio, fetchStock, getStockCache }
