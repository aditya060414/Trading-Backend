const { model } = require("mongoose");

const { OrderSchema } = require("../schema/OrdersSchema");

const OdersModel = new model("order", OrderSchema);

module.exports = { OdersModel };
