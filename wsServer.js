const WebSocket = require("ws");
const axios = require('axios');
const http = require("http");

let stockCache = [];

const PORT = process.env.PORT || 4000;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const fetchStock = async () => {
  try {
    const res = await axios.get("https://nse-stock-data-api.onrender.com/api/stocks");
    stockCache = res.data;
    console.log("Stock data loaded:", stockCache.length);
  } catch (error) {
    console.error("Error fetching data", error.message);
  }
}
fetchStock();

setInterval(fetchStock, 6 * 60 * 60 * 1000);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (msg) => {

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
      const regex = new RegExp(`${query}`, "i");
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
