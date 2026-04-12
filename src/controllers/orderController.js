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