const { OrdersHistoryModel } = require('../models/OrdersHistoryModel');
const orderService = require('../services/orderServices');

module.exports.placeOrder = async (req, res) => {
    const { quantity, symbol, close, mode } = req.body;
    const email = req.user.email;
    const userId = req.user.id;

    // 1. Validation
    if (!quantity || quantity < 0 || !symbol || !close || !["BUY", "SELL"].includes(mode)) {
        return res.status(400).json({ success: false, message: "Invalid order data" });
    }
    if (!email) {
        return res.status(400).json({ success: false, message: "Email required" })
    }

    try {
        const result = await orderService.processOrder({
            quantity,
            symbol,
            close,
            mode,
            email,
            userId
        });
        return res.status(201).json({
            success: true,
            message: result.message,
            error: result.error,
        });
    } catch (err) {
        const status = err.message === "Insufficient holdings to sell" ? 400 : 500;
        return res.status(status).json({
            success: false,
            message: err.message
        });
    }
};

module.exports.getUserHistory = async (req, res) => {
    const userEmail = req.user.email;

    try {
        if (!userEmail) {
            return res.status(400).json({
                status: false,
                message: "User not Logged in."
            })
        }

        const history = await OrdersHistoryModel.find({email:userEmail});

        if(!history){
            return res.status(404).json({
                status:false,
                message:"No History Found."
            })
        }

        return res.status(200).json({
            status:true,
            message:"History Fetched Successfully",
            data:history
        })

    } catch (error) {
        return res.status(500).json({
            status:false,
            message:"Internal Server Error."
        })
    }

}