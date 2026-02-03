require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { WatchlistModel } = require("./model/WatchlistModel");

const bodyParser = require("body-parser");
const cors = require("cors");

const PORT = process.env.PORT || 3002;
const URL = process.env.MONGO_URL;


//  app.get("/addHoldings", async (req, res) => {
//   let tempHoldings = [
//   {
//     instrument: "BHARTIARTL",
//     qty: 2,
//     avgCost: 538.05,
//     ltp: 541.15,
//     curVal: 1082.3,
//     pnl: 6.2,
//     netChg: 0.58,
//     dayChg: 2.99,
//   },
//   {
//     instrument: "RELIANCE",
//     qty: 5,
//     avgCost: 2450,
//     ltp: 2680.2,
//     curVal: 13401,
//     pnl: 1151,
//     netChg: 9.39,
//     dayChg: 1.25,
//   },
//   {
//     instrument: "TCS",
//     qty: 3,
//     avgCost: 3320.5,
//     ltp: 3450.1,
//     curVal: 10350.3,
//     pnl: 388.8,
//     netChg: 3.9,
//     dayChg: -0.45,
//   },
//   {
//     instrument: "HDFCBANK",
//     qty: 10,
//     avgCost: 1480,
//     ltp: 1510.3,
//     curVal: 15103,
//     pnl: 303,
//     netChg: 2.04,
//     dayChg: 0.8,
//   },
//   {
//     instrument: "INFY",
//     qty: 6,
//     avgCost: 1590.25,
//     ltp: 1550.4,
//     curVal: 9302.4,
//     pnl: -239.1,
//     netChg: -2.51,
//     dayChg: -1.1,
//   },
//   {
//     instrument: "ICICIBANK",
//     qty: 4,
//     avgCost: 980,
//     ltp: 1025.6,
//     curVal: 4102.4,
//     pnl: 182.4,
//     netChg: 4.65,
//     dayChg: 0.95,
//   },
//   {
//     instrument: "ITC",
//     qty: 12,
//     avgCost: 415.2,
//     ltp: 421.8,
//     curVal: 5061.6,
//     pnl: 79.2,
//     netChg: 1.58,
//     dayChg: 0.42,
//   },
//   {
//     instrument: "SBIN",
//     qty: 8,
//     avgCost: 585,
//     ltp: 610.4,
//     curVal: 4883.2,
//     pnl: 203.2,
//     netChg: 4.34,
//     dayChg: 1.02,
//   },
//   {
//     instrument: "AXISBANK",
//     qty: 6,
//     avgCost: 965,
//     ltp: 998.5,
//     curVal: 5991,
//     pnl: 201,
//     netChg: 3.47,
//     dayChg: 0.67,
//   },
//   {
//     instrument: "MARUTI",
//     qty: 1,
//     avgCost: 10450,
//     ltp: 10880,
//     curVal: 10880,
//     pnl: 430,
//     netChg: 4.12,
//     dayChg: 0.9,
//   },
//   {
//     instrument: "HINDUNILVR",
//     qty: 4,
//     avgCost: 2520,
//     ltp: 2555,
//     curVal: 10220,
//     pnl: 140,
//     netChg: 1.38,
//     dayChg: 0.3,
//   },
//   {
//     instrument: "WIPRO",
//     qty: 15,
//     avgCost: 415,
//     ltp: 402.3,
//     curVal: 6034.5,
//     pnl: -190.5,
//     netChg: -3.07,
//     dayChg: -1.25,
//   },
//   {
//     instrument: "ADANIPORTS",
//     qty: 3,
//     avgCost: 780,
//     ltp: 820.4,
//     curVal: 2461.2,
//     pnl: 121.2,
//     netChg: 5.18,
//     dayChg: 1.1,
//   },
//   {
//     instrument: "BAJFINANCE",
//     qty: 2,
//     avgCost: 7050,
//     ltp: 7325,
//     curVal: 14650,
//     pnl: 550,
//     netChg: 3.9,
//     dayChg: 0.88,
//   },
//   {
//     instrument: "LT",
//     qty: 3,
//     avgCost: 2950,
//     ltp: 3025.5,
//     curVal: 9076.5,
//     pnl: 226.5,
//     netChg: 2.56,
//     dayChg: 0.44,
//   },
//   {
//     instrument: "SUNPHARMA",
//     qty: 7,
//     avgCost: 1140,
//     ltp: 1185.2,
//     curVal: 8296.4,
//     pnl: 316.4,
//     netChg: 3.96,
//     dayChg: 0.75,
//   },
//   {
//     instrument: "ONGC",
//     qty: 20,
//     avgCost: 210,
//     ltp: 218.4,
//     curVal: 4368,
//     pnl: 168,
//     netChg: 4.0,
//     dayChg: 0.55,
//   },
//   {
//     instrument: "POWERGRID",
//     qty: 18,
//     avgCost: 245,
//     ltp: 250.1,
//     curVal: 4501.8,
//     pnl: 91.8,
//     netChg: 2.04,
//     dayChg: 0.4,
//   },
//   {
//     instrument: "TITAN",
//     qty: 2,
//     avgCost: 3450,
//     ltp: 3580,
//     curVal: 7160,
//     pnl: 260,
//     netChg: 3.77,
//     dayChg: 0.62,
//   },
//   {
//     instrument: "COALINDIA",
//     qty: 10,
//     avgCost: 385,
//     ltp: 392.6,
//     curVal: 3926,
//     pnl: 76,
//     netChg: 1.97,
//     dayChg: 0.33,
//   },
// ];

//   tempHoldings.forEach((item) => {
//     let newHolding = new HoldingsModel({
//       instrument: item.instrument,
//       qty: item.qty,
//       avgCost: item.avgCost,
//       ltp: item.ltp,
//       curVal: item.curVal,
//       pnl: item.pnl,
//       netChg: item.netChg,
//       dayChg: item.dayChg,
//     });
//     newHolding.save();
//   });
//   res.send("data saved");
// });

// app.get("/addPositions", async (req, res) => {
//   let tempHoldings = [
//     {
//       product: "MIS",
//       instrument: "RELIANCE",
//       qty: 10,
//       avgCost: 2670,
//       ltp: 2682,
//       pnl: 120,
//       chg: 0.45,
//     },
//     {
//       product: "CNC",
//       instrument: "TCS",
//       qty: 5,
//       avgCost: 3420,
//       ltp: 3455,
//       pnl: 175,
//       chg: 0.82,
//     },
//     {
//       product: "MIS",
//       instrument: "INFY",
//       qty: 12,
//       avgCost: 1560,
//       ltp: 1548,
//       pnl: -144,
//       chg: -0.77,
//     },
//     {
//       product: "CNC",
//       instrument: "HDFCBANK",
//       qty: 8,
//       avgCost: 1490,
//       ltp: 1512,
//       pnl: 176,
//       chg: 0.92,
//     },
//     {
//       product: "MIS",
//       instrument: "ICICIBANK",
//       qty: 20,
//       avgCost: 1010,
//       ltp: 1024,
//       pnl: 280,
//       chg: 1.39,
//     },
//     {
//       product: "CNC",
//       instrument: "ITC",
//       qty: 25,
//       avgCost: 420,
//       ltp: 418,
//       pnl: -50,
//       chg: -0.48,
//     },
//     {
//       product: "MIS",
//       instrument: "SBIN",
//       qty: 15,
//       avgCost: 605,
//       ltp: 612,
//       pnl: 105,
//       chg: 0.64,
//     },
//     {
//       product: "CNC",
//       instrument: "AXISBANK",
//       qty: 10,
//       avgCost: 990,
//       ltp: 997,
//       pnl: 70,
//       chg: 0.71,
//     },
//   ];
//   for (const item of tempHoldings) {
//     const newHolding = new PositionsModel({
//       product: item.product,
//       instrument: item.instrument,
//       qty: item.qty,
//       avgCost: item.avgCost,
//       ltp: item.ltp,
//       pnl: item.pnl,
//       chg: item.chg,
//     });
//     await newHolding.save();
//   }
//   res.send("data saved");
// });

// app.get("/addWatchlists", async (req, res) => {
//   // let tempHoldings = [
//   //   {
//   //     name: "RELIANCE",
//   //     price: 2680.25,
//   //     percent: 1.24,
//   //     isDown: false,
//   //   },
//   //   {
//   //     name: "TCS",
//   //     price: 3450.1,
//   //     percent: -0.42,
//   //     isDown: true,
//   //   },
//   //   {
//   //     name: "HDFCBANK",
//   //     price: 1510.3,
//   //     percent: 0.88,
//   //     isDown: false,
//   //   },
//   //   {
//   //     name: "INFY",
//   //     price: 1550.45,
//   //     percent: -1.15,
//   //     isDown: true,
//   //   },
//   //   {
//   //     name: "ICICIBANK",
//   //     price: 1025.6,
//   //     percent: 0.95,
//   //     isDown: false,
//   //   },
//   //   {
//   //     name: "ITC",
//   //     price: 421.8,
//   //     percent: 0.42,
//   //     isDown: false,
//   //   },
//   //   {
//   //     name: "SBIN",
//   //     price: 610.4,
//   //     percent: 1.02,
//   //     isDown: false,
//   //   },
//   //   {
//   //     name: "AXISBANK",
//   //     price: 998.5,
//   //     percent: -0.67,
//   //     isDown: true,
//   //   },
//   //   {
//   //     name: "MARUTI",
//   //     price: 10880.0,
//   //     percent: 0.9,
//   //     isDown: false,
//   //   },
//   //   {
//   //     name: "TITAN",
//   //     price: 3580.2,
//   //     percent: -0.31,
//   //     isDown: true,
//   //   },
//   // ];
//   // for (const item of tempHoldings) {
//   //   let newHoldings = new WatchlistModel({
//   //     name: item.name,
//   //     price: item.price,
//   //     percent: item.percent,
//   //     isDown: item.isDown,
//   //   });
//   //   await newHoldings.save();
//   // }
//   res.send("data saved");
// });

app.use(cors());
app.use(bodyParser.json())

app.get("/allHoldings", async (req, res) => {
  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});
app.get("/allPositions", async (req, res) => {
  let allPositions = await PositionsModel.find({});
  res.json(allPositions);
});
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo error:", err.message));

app.listen(PORT, () => console.log("Server running"));
