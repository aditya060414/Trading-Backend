require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { HoldingsModel } = require("./server/model/HoldingsModel");
const { PositionsModel } = require("./server/model/PositionsModel");
const { OrdersModel } = require("./server/model/OrdersModel");
const { OrdersHistoryModel } = require("./server/model/OrdersHistoryModel");
const authRoute = require("./server/Routes/AuthRoute");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");


const PORT = process.env.PORT || 3002;
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
  // console.log(req.body);
  const { quantity, name, price, mode } = req.body;
  const newPrice = price * quantity;
  try {
    if (!quantity || !name || !price || !mode) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    const newHistory = new OrdersHistoryModel({
      name: name,
      qty: quantity,
      price: newPrice,
      mode: mode,
    });
    await newHistory.save();
    const existingOrder = await OrdersModel.findOne({
      name: name,
    });
    if (existingOrder) {
      if (mode === "BUY") {
        existingOrder.qty += Number(quantity);
        existingOrder.price += newPrice;
        await existingOrder.save();
      } else {
        existingOrder.qty -= Number(quantity);
        existingOrder.price -= newPrice;
        await existingOrder.save();
      }
    } else {
      const newOrder = new OrdersModel({
        name: name,
        qty: quantity,
        price: newPrice,
      });
      await newOrder.save();
    }

    res.status(201).json({
      success: true,
      message: ":Order saved Successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "server error",
    });
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
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo error:", err.message));


app.listen(PORT, () => console.log("Server running"));
