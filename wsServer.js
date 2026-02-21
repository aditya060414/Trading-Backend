const WebSocket = require("ws");
const mongoose = require("mongoose");
const Stock = require("./server/model/Stock"); // your schema

mongoose.connect("mongodb://127.0.0.1:27017/nse_stocks");

const wss = new WebSocket.Server({ port: 4000 });

console.log("WebSocket server running on ws://localhost:4000");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (msg) => {
    const { type, query } = JSON.parse(msg);

    if (type === "SEARCH") {
      if (!query) {
        ws.send(JSON.stringify([]));
        return;
      }
      const regex = new RegExp(`^${query}`, "i");
      const results = await Stock.aggregate([
        { $match: { symbol: regex } },
        { $sort: { date: -1 } }, // latest first
        {
          $group: {
            _id: "$symbol",
            symbol: { $first: "$symbol" },
            close: { $first: "$close" },
          },
        },
        { $limit: 20 },
      ]);

      ws.send(JSON.stringify(results));
    }
  });
  ws.on("close", () => console.log("Client disconnected"));
});
