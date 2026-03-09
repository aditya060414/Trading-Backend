require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { HoldingsModel } = require("./server/model/HoldingsModel");
const { PositionsModel } = require("./server/model/PositionsModel");
const { OrdersModel } = require("./server/model/OrdersModel");
const { OrdersHistoryModel } = require("./server/model/OrdersHistoryModel");
const { WatchlistModel } = require("./server/model/WatchlistModel");
const { FundsModel } = require("./server/model/FundsModel");
const { FundsHistoryModel } = require("./server/model/FundsHistoryModel");
const authRoute = require("./server/Routes/AuthRoute");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { findOne } = require("./server/model/UserModel");

const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRoute);

app.get("/allHoldings", async (req, res) => {
  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

app.get("/allPositions", async (req, res) => {
  let allPositions = await PositionsModel.find({});
  res.json(allPositions);
});

app.post("/orders", async (req, res) => {
  const { quantity, symbol, close, mode, email } = req.body;

  if (!quantity || quantity <= 0 || !symbol || !close || !mode) {
    return res.status(400).json({ message: "Invalid order data" });
  }
  if (!email) {
    return res.status(550).json({ message: "Invalid user email" });
  }
  const newPrice = close * quantity;

  try {
    const existingOrder = await OrdersModel.findOne({ symbol, email });

    if (mode === "SELL") {
      if (!existingOrder || existingOrder.qty < quantity) {
        return res.status(400).json({
          message: "Insufficient holdings to sell",
        });
      }
    }

    const newHistory = new OrdersHistoryModel({
      symbol,
      qty: quantity,
      close: newPrice,
      mode,
      email,
    });
    await newHistory.save();

    if (mode === "BUY") {
      if (existingOrder) {
        existingOrder.qty += quantity;
        existingOrder.gross += newPrice;
        await existingOrder.save();
      } else {
        await OrdersModel.create({
          symbol,
          qty: quantity,
          close: close,
          gross: newPrice,
          email,
        });
      }
    }

    if (mode === "SELL") {
      existingOrder.qty -= quantity;
      existingOrder.gross -= newPrice;

      if (existingOrder.qty === 0) {
        await OrdersModel.deleteOne({ symbol, email });
      } else {
        await existingOrder.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/fetchOrders/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const orders = await OrdersModel.find({ email });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "failed to fetch details",
    });
  }
});

app.get("/orderHistory/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const orders = await OrdersHistoryModel.find({ email });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "failed to fetch orders",
    });
  }
});
app.get("/me", (req, res) => {
  if (!req.cookies.token) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: req.user, // or decoded token
  });
});

app.post("/watchlist", async (req, res) => {
  const { email, symbol, high, close } = req.body;

  try {
    const item = await WatchlistModel.create({
      email,
      symbol,
      high,
      close,
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Stock already in watchlist",
      });
    }
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/watchlistData", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const stocks = await WatchlistModel.find({ email }).sort({ createdAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: "Failed to load watchlist" });
  }
});

app.put("/syncAllWatchlists", async (req, res) => {
  try {
    console.log("Bulk sync starting...");

    // Get all watchlist entries
    const watchlist = await WatchlistModel.find({}, { symbol: 1 });

    if (!watchlist.length) {
      return res.json({ message: "No watchlists found" });
    }

    //  Extract unique symbols
    const symbols = [...new Set(watchlist.map((s) => s.symbol))];

    //  Fetch latest stock data in ONE query
    const latestStocks = await Stock.find({
      symbol: { $in: symbols },
    });

    //  Create symbol → stock map
    const stockMap = {};
    latestStocks.forEach((stock) => {
      stockMap[stock.symbol] = stock;
    });

    //  Prepare bulk operations
    const bulkOps = latestStocks.map((stock) => ({
      updateMany: {
        filter: { symbol: stock.symbol },
        update: {
          $set: {
            close: stock.close,
            high: stock.high,
            open: stock.open,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await WatchlistModel.bulkWrite(bulkOps);
    }

    console.log(" Bulk sync completed");

    res.json({
      success: true,
      updatedCount: bulkOps.length,
    });
  } catch (err) {
    console.error(" Bulk sync failed:", err);
    res.status(500).json({ message: "Sync failed" });
  }
});

app.post("/getLatestStock", async (req, res) => {
  const { symbols } = req.body;
  // Find latest available trading date

  const dates = await Stock.aggregate([
  { $group: { _id: "$tradeDate" } },
  { $sort: { _id: -1 } },
  { $limit: 2 }
]);

const latestDate = dates[0]._id;
const prevDate = dates[1]._id;

  const todayStocks = await Stock.find({
    symbol: { $in: symbols },
    tradeDate: latestDate,
  }).lean();

   const prevStocks = await Stock.find({
    symbol: { $in: symbols },
    tradeDate: prevDate,
  }).lean();
  
   const prevMap = Object.fromEntries(
    prevStocks.map((s) => [s.symbol, s.close])
  );

   const stockMap = Object.fromEntries(
    todayStocks.map((stock) => [
      stock.symbol,
      {
        open: stock.open,
        high: stock.high,
        low: stock.low,
        close: stock.close,
        prevClose: prevMap[stock.symbol] || stock.close,
      },
    ])
  );

  res.json(stockMap);
});

app.post("/funds/:email", async (req, res) => {
  const { email } = req.params;
  const { deposit, withdraw } = req.body;

  const depositAmt = Number(deposit) || 0;
  const withdrawAmt = Number(withdraw) || 0;
  try {
    const user = await FundsModel.findOne({ email });

    // negative amount validation
    if (depositAmt < 0 || withdrawAmt < 0) {
      return res.status(400).json({ message: "Amount cannot be negative" });
    }
    if (user) {
      if (depositAmt > 0) {
        user.amount += depositAmt;
        await user.save();
        await new FundsHistoryModel({
          email: email,
          transaction: "Deposit",
          amount: depositAmt,
        }).save();
        return res.status(201).json({
          message: "Money Deposited Successfully",
        });
      } else if (withdrawAmt > 0) {
        if (user.amount < withdrawAmt) {
          return res.status(400).json({
            message: "Insufficient balance",
          });
        }
        user.amount -= withdrawAmt;
        await user.save();
        await new FundsHistoryModel({
          email: email,
          transaction: "Withdraw",
          amount: -withdrawAmt,
        }).save();
        return res.status(200).json({
          message: "Transaction Successful",
          amount: user.amount,
        });
      }
    } else {
      if (depositAmt > 0) {
        await new FundsModel({
          email: email,
          amount: depositAmt,
        }).save();
        await new FundsHistoryModel({
          email: email,
          transaction: "Deposit",
          amount: depositAmt,
        }).save();
        return res.status(200).json({
          message: "Funds deposited in your account",
        });
      }
      return res.status(400).json({ message: "Insufficient Balance" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Invalid data" });
  }
});
app.get("/funds/:email", async (req, res) => {
  const { email } = req.params;
  const user = await FundsModel.findOne({ email });
  if (!user) {
    return res.status(200).json({ balance: 0 });
  }
  return res.status(200).json({ balance: user.amount });
});
app.get("/fundshistory/:email", async (req, res) => {
  const { email } = req.params;
  const history = await FundsHistoryModel.find({ email }).sort({
    createdAt: -1,
  });
  if (!history || history.length === 0) {
    return res.status(200).json([]);
  }
  return res.status(200).json(history);
});

// delete route for watchlist
app.delete("/watchlist", async (req, res) => {
  try {
    const { symbol, email } = req.body;
    if (!email || !symbol) {
      return res.status(400).json({ message: "Email and symbol are required" });
    }
    const result = await WatchlistModel.deleteOne({ symbol, email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Item not found in watchlist" });
    }

    res.status(200).json({
      message: "Stock removed from watchlist",
      result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting from watchlist",
      error: error.message,
    });
  }
});

// Default DB (Main DB)
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo error:", err.message));

// Second DB (Stock DB)
const stockDB = mongoose.createConnection(process.env.STOCKDB);

stockDB.on("connected", () => {
  console.log("Updated stock database connected");
});

stockDB.on("error", (err) => {
  console.error("Stock DB error:", err.message);
});

// Define schema here
const stockSchema = new mongoose.Schema({
  symbol: String,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  tradeDate: String,
});

// Create model USING stockDB
const Stock = stockDB.model("Stock", stockSchema);

app.listen(PORT, () => console.log("Server running"));
