const mongoose = require('mongoose');
const OrdersModel = require('../models/OrdersModel');
const OrdersHistoryModel = require('../models/OrdersHistoryModel');

exports.processOrder = async (orderData) => {
    const { quantity, symbol, close, mode, email } = orderData;
    const totalPrice = quantity * close;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingOrder = await OrdersModel.findOne({ email, symbol }).session(session);

        // 1. Logic Validation
        if (mode === "SELL") {
            if (!existingOrder || existingOrder.qty < quantity) {
                throw new Error("Insufficient holdings to sell");
            }
        }

        // 2. Log to history
        await OrdersHistoryModel.create([{
            symbol,
            qty: quantity,
            price: close,
            totalAmount: totalPrice,
            mode, 
            email,
        }], { session });

        // 3. Update holdings
        if (mode === "BUY") {
            if (existingOrder) {
                // Update average price and quantity
                const newQty = existingOrder.qty + quantity;
                const newInvestment = existingOrder.totalInvestment + totalPrice;
                
                existingOrder.qty = newQty;
                existingOrder.totalInvestment = newInvestment;
                existingOrder.avgPrice = newInvestment / newQty; // Recalculate Average Price
                await existingOrder.save({ session });
            } else {
                await Order.create([{
                    symbol, 
                    qty: quantity, 
                    avgPrice: close, 
                    totalInvestment: totalPrice, 
                    email
                }], { session });
            }
        } else if (mode === "SELL") {
            existingOrder.qty -= quantity;
            existingOrder.totalInvestment -= (existingOrder.avgPrice * quantity); // Reduce investment by avg cost

            if (existingOrder.qty <= 0) {
                await Order.deleteOne({ _id: existingOrder._id }).session(session);
            } else {
                await existingOrder.save({ session });
            }
        }

        await session.commitTransaction();
        return { success: true };
    } catch (error) {
        await session.abortTransaction();
        throw error; 
    } finally {
        session.endSession();
    }
};