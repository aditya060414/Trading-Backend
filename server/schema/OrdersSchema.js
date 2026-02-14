const { Schema } = require("mongoose");

const OrdersSchema = new Schema({
  name: String,
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
},{
  timestamps:true
});

module.exports = { OrdersSchema };
