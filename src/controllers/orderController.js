const orderService = require('../services/orderServices');

exports.placeOrder = async (req, res) => {
    const { quantity, symbol, close, mode, email } = req.body;

    // 1. Validation
    if (!quantity || quantity <= 0 || !symbol || !close || !["BUY", "SELL"].includes(mode)) {
        return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    try {
        const result = await orderService.processOrder(req.body);
        return res.status(201).json({
            success: true,
            message: "Order processed successfully",
            data: result
        });
    } catch (err) {
        const status = err.message === "Insufficient holdings to sell" ? 400 : 500;
        return res.status(status).json({ 
            success: false, 
            message: err.message 
        });
    }
};