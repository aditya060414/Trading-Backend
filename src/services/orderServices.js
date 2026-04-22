const mongoose = require('mongoose');
const { OrdersModel } = require('../models/OrdersModel');
const { OrdersHistoryModel } = require('../models/OrdersHistoryModel');
const { updateBalance } = require('../controllers/fundsController');
const redisClient = require('../config/redis');

module.exports.processOrder = async (orderData) => {
    const { quantity, symbol, close, mode, email, userId } = orderData;
    const totalPrice = parseFloat((quantity * close).toFixed(2));

    // start session to maintain atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    // 1. Log to history {STATUS - PENDING}
    let orderHistories = await OrdersHistoryModel.create([{
        symbol,
        qty: quantity,
        price: close,
        totalAmount: totalPrice,
        mode,
        email,
        status: "PENDING",
    }], { session });
    let orderHistory = orderHistories[0];
    try {
        const existingOrder = await OrdersModel.findOne({ email, symbol }).session({ session });

        // 2. Validation Logic
        if (mode === "SELL") {
            if (!existingOrder || existingOrder.qty < quantity) {
                throw new Error("Insufficient holdings to sell");
            }
        }

        // 3. Update Wallet
        const balanceChange = mode === "BUY" ? -totalPrice : totalPrice;
        const wallet = await updateBalance({
            userId,
            amount: balanceChange,
            type: mode,
            symbol: symbol,
            session
        });

        // 3. Update Holdings
        if (mode === "BUY") {
            if (existingOrder) {
                const newQty = existingOrder.qty + quantity;
                const newInvestment = parseFloat((existingOrder.totalInvestment + totalPrice).toFixed(2));

                existingOrder.qty = newQty;
                existingOrder.totalInvestment = newInvestment;
                existingOrder.avgPrice = parseFloat((newInvestment / newQty).toFixed(2));
                await existingOrder.save({ session });
            } else {
                await OrdersModel.create([{
                    userId, symbol, qty: quantity, avgPrice: close,
                    totalInvestment: totalPrice, email, mode
                }],

                    { session }
                );
            }
        } else {
            // SELL Logic
            existingOrder.qty -= quantity;
            // Reduce investment proportional to the quantity sold based on avgPrice
            existingOrder.totalInvestment -= parseFloat((existingOrder.avgPrice * quantity).toFixed(2));

            if (existingOrder.qty <= 0) {
                await OrdersModel.deleteOne({ _id: existingOrder._id })
                    .session(session);
            } else {
                await existingOrder.save({ session });
            }
        }

        // 4. Finalize History
        orderHistory.status = "COMPLETED";
        await orderHistory.save({ session });

        // Commit all changes
        await session.commitTransaction();

        // 5. Update Cache (After transaction success)
        await redisClient.setEx(`balance:${userId}`, 3600, wallet.balance.toFixed(2));
        await redisClient.del(`portfolio:${userId}`);

        return { success: true, message: "Order processed successfully" };

    } catch (error) {
        await session.abortTransaction();

        // Update history status to failed
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

        return { success: false, message: error.message };
    }
    finally {
        session.endSession();
    }
};