require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { HoldingsModel } = require("./server/model/HoldingsModel");
const { PositionsModel } = require("./server/model/PositionsModel");
const { OrdersModel } = require("./server/model/OrdersModel");
const { OrdersHistoryModel } = require("./server/model/OrdersHistoryModel");
const { WatchlistModel } = require("./server/model/WatchlistModel");
const authRoute = require("./server/Routes/AuthRoute");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT;
const URL = process.env.MONGO_URL;

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
  const { quantity, name, price, mode } = req.body;

  if (!quantity || quantity <= 0 || !name || !price || !mode) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const newPrice = price * quantity;

  try {
    const existingOrder = await OrdersModel.findOne({ name });

    if (mode === "SELL") {
      if (!existingOrder || existingOrder.qty < quantity) {
        return res.status(400).json({
          message: "Insufficient holdings to sell",
        });
      }
    }

    const newHistory = new OrdersHistoryModel({
      name,
      qty: quantity,
      price: newPrice,
      mode,
    });
    await newHistory.save();

    if (mode === "BUY") {
      if (existingOrder) {
        existingOrder.qty += quantity;
        existingOrder.price += newPrice;
        await existingOrder.save();
      } else {
        await OrdersModel.create({
          name,
          qty: quantity,
          price: newPrice,
        });
      }
    }

    if (mode === "SELL") {
      existingOrder.qty -= quantity;
      existingOrder.price -= newPrice;

      if (existingOrder.qty === 0) {
        await OrdersModel.deleteOne({ name });
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

app.get("/fetchOrders", async (req, res) => {
  try {
    const orders = await OrdersModel.find();
    // console.log(req.params.id);
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "failed to fetch details",
    });
  }
});

app.get("/orderHistory", async (req, res) => {
  try {
    const orders = await OrdersHistoryModel.find();
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
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo error:", err.message));

app.listen(PORT, () => console.log("Server running"));
