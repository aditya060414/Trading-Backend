const mongoose = require('mongoose');
const { OrdersModel } = require('../models/OrdersModel');
const { OrdersHistoryModel } = require('../models/OrdersHistoryModel');
const { buyStock, sellStock } = require('../controllers/fundsController');
const redisClient = require('../config/redis');

module.exports.processOrder = async (orderData) => {
    const { quantity, symbol, close, mode, email, userId } = orderData;
    const totalPrice = parseFloat((quantity * close).toFixed(2));
    let orderHistory;

    try {
        let wallet;
        // 1. Log to history {STATUS - PENDING}
        orderHistory = await OrdersHistoryModel.create({
            symbol,
            qty: quantity,
            price: close,
            totalAmount: totalPrice,
            mode,
            email,
            status: "PENDING",
        });

        const existingOrder = await OrdersModel.findOne({ email, symbol });

        // 2. Logic Validation
        if (mode === "SELL") {
            if (!existingOrder || existingOrder.qty < quantity) {
                throw new Error("Insufficient holdings to sell");
            }
        }

        if (mode === "BUY") {
            wallet = await buyStock({ totalPrice, userId });
        }
        if (mode === "SELL") {
            wallet = await sellStock({ totalPrice, userId });
        }

        // 3. Update holdings
        if (mode === "BUY") {
            if (existingOrder) {
                const newQty = existingOrder.qty + quantity;
                const newInvestment = parseFloat((existingOrder.totalInvestment + totalPrice).toFixed(2));

                existingOrder.qty = newQty;
                existingOrder.totalInvestment = newInvestment;
                existingOrder.avgPrice = parseFloat((newInvestment / newQty).toFixed(2));
                await existingOrder.save();
            } else {
                await OrdersModel.create({
                    symbol,
                    qty: quantity,
                    avgPrice: close,
                    totalInvestment: totalPrice,
                    email,
                    mode
                });
            }
        } else if (mode === "SELL") {
            existingOrder.qty -= quantity;
            existingOrder.totalInvestment -= parseFloat((existingOrder.avgPrice * quantity).toFixed(2));

            if (existingOrder.qty <= 0) {
                await OrdersModel.deleteOne({ _id: existingOrder._id });
            } else {
                await existingOrder.save();
            }
        }

        // 4. change status
        orderHistory.status = "COMPLETED";
        await orderHistory.save();

        // 5. Update Cache
        if (wallet) {
            await redisClient.setEx(`balance:${userId}`, 3600, wallet.balance.toFixed(2));
        }
        await redisClient.del(`portfolio:${userId}`);

        return { success: true, message: "Order processed successfully" };
    } catch (error) {
        try {
            if(orderHistory){
             orderHistory.status = "FAILED";
             orderHistory.reason = error.message;
             await orderHistory.save();
            }
        } catch (error) {
            // fallback if pending not created
            await OrdersHistoryModel.create({
                symbol,
                qty: quantity,
                price: close,
                totalAmount: totalPrice,
                mode,
                email,
                status: "FAILED",
                reason: error.message
            });
        }
        return { success: false, message: "Order failed", error: error.message };
    }
};
