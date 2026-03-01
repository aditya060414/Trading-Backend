const { model } = require("mongoose");

const { FundsHistorySchema } = require("../schema/FundsHistorySchema");
const FundsHistoryModel = new model("fundshistory", FundsHistorySchema);

module.exports = { FundsHistoryModel };
