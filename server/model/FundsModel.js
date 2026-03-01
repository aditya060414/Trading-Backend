const { model } = require("mongoose");

const { FundsSchema } = require("../schema/FundsSchema");
const FundsModel = new model("funds", FundsSchema);

module.exports = { FundsModel };
