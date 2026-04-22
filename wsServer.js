require("dotenv").config();
const WebSocket = require("ws");
const axios = require('axios');
const http = require("http");
const { connectDB } = require("./src/config/db");
const { StockModel } = require("./src/models/StockModel");


let stockCache = [];

const PORT = process.env.PORT || 4000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

connectDB()
  .then(async () => {
    await initCache();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start WebSocket server:", err);
  });
const initCache = async () => {
  stockCache = await StockModel.find();
  console.log("Stock cache initialized:", stockCache.length);
};

const fetchStock = async () => {
  try {
    const res = await axios.get("https://nse-stock-data-api.onrender.com/api/stocks");

    if (!res.data || !Array.isArray(res.data)) {
      console.error("API ERROR: Data is not an array!");
      return;
    }
    // Persist to MongoDB using bulkWrite for efficiency
    const bulkOps = res.data.map(stock => ({
      updateOne: {
        filter: { symbol: stock.symbol },
        update: {
          $set: {
            symbol: stock.symbol,
            open: stock.open,
            high: stock.high,
            low: stock.low,
            close: stock.close,
            tradeDate: stock.tradeDate,
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await StockModel.bulkWrite(bulkOps);
      console.log("Database updated with latest stock data");

      stockCache = await StockModel.find();
      console.log("Cache refreshed:", stockCache.length);
    }

  } catch (error) {
    console.error("Error fetching or persisting data", error.message);
  }
}



fetchStock();
setInterval(fetchStock, 12 * 60 * 60 * 1000); // every 12 hour


wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (msg) => {
    console.log("Received message:", msg.toString());
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    const { type, query } = data;

    if (type === "SEARCH") {
      if (!query) {
        ws.send(JSON.stringify([]));
        return;
      }
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeQuery, "i");
      const grouped = {};

      for (let stock of stockCache) {
        if (!regex.test(stock.symbol)) continue;

        if (
          !grouped[stock.symbol] ||
          new Date(stock.tradeDate) >
          new Date(grouped[stock.symbol].tradeDate)
        ) {
          grouped[stock.symbol] = stock;
        }
      }

      const results = Object.values(grouped)
        .slice(0, 20)
        .map((s) => ({
          symbol: s.symbol,
          close: s.close,
          open: s.open,
          high: s.high,
          low: s.low,
        }));

      ws.send(JSON.stringify({
        type: "SEARCH_RESULTS",
        data: results
      }));
    }
  });
  ws.on("close", () => console.log("Client disconnected"));
});
