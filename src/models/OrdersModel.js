const mongoose = require("mongoose");

const { OrdersSchema } = require("../schema/OrdersSchema");

const OrdersModel = mongoose.model("Order", OrdersSchema);

module.exports = { OrdersModel };
