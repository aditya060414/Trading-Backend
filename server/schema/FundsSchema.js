const { Schema } = require("mongoose");

const FundsSchema = new Schema({
  email: { type: String, required: true },
  amount: { type: Number, default: 0 },
});

module.exports = { FundsSchema };
