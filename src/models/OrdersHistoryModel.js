const mongoose = require("mongoose");
const { OrdersHistorySchema } = require("../schema/OrdersHistorySchema.js");

const OrdersHistoryModel = mongoose.model("OrdersHistory", OrdersHistorySchema);

module.exports = { OrdersHistoryModel };
