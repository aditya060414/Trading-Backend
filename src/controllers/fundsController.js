const { Wallet, Transaction } = require('../models/FundsModel');
const orderService = require('../services/orderServices');
const redisClient = require('../config/redis');

module.exports.getFunds = async (req, res) => {
    try {
        const userId = req.user.id;
        // 1. Check Redis (Stored as string "100.50")
        const cachedBalance = await redisClient.get(`balance:${userId}`);
        if (cachedBalance) {
            return res.status(200).json({
                balance: parseFloat(cachedBalance).toFixed(2), // Force 2 decimal places
                source: 'cache'
            });
        }
        // 2. Fallback to DB
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

        const formattedBalance = wallet.balance.toFixed(2);

        // 3. Cache in Redis
        await redisClient.setEx(`balance:${userId}`, 3600, formattedBalance);

        res.status(200).json({ balance: formattedBalance });
    } catch (err) {
        res.status(500).json({ message: "Error fetching balance" });
    }
}
module.exports.addFunds = async (req, res) => {
    let transaction;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        let { amount } = req.body;

        // Force amount to 2 decimal places
        const cleanAmount = parseFloat(parseFloat(amount).toFixed(2));

        if (isNaN(cleanAmount) || cleanAmount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // 1. Log Transaction
        transaction = await Transaction.create([{
            userId,
            type: "ADD",
            amount: cleanAmount,
            status: "PENDING",
        }], { session });

        // 2. Atomic Update in DB
        // $inc works with decimals, Mongoose 'set' handles the rounding
        const wallet = await Wallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: cleanAmount } },
            { new: true, upsert: true, session }
        );

        const finalBalance = wallet.balance.toFixed(2);

        // 3. Mark COMPLETED
        transaction.status = "COMPLETED";
        transaction.balanceAfter = wallet.balance;
        await transaction.save({ session });

        // 4. Update Redis
        await redisClient.setEx(`balance:${userId}`, 3600, finalBalance);
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            newBalance: finalBalance
        });
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        // 4. Mark FAILED
        if (transaction) {
            transaction.status = "FAILED";
            transaction.reason = err.message;
            await transaction.save();
        }
        res.status(500).json({ message: "Transaction failed" });
    }
    finally {
        session.endSession();
    }
}

module.exports.fundsHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        // Return last 20 transactions
        const history = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        const formattedHistory = history.map(t => ({
            ...t._doc,
            amount: parseFloat(parseFloat(t.amount).toFixed(2)),
            balanceAfter: parseFloat(parseFloat(t.balanceAfter).toFixed(2))
        }));

        res.status(200).json({ history: formattedHistory });
    } catch (err) {
        res.status(500).json({ message: "Error fetching history" });
    }
}

module.exports.withdrawFunds = async (req, res) => {
    const userId = req.user.id;
    let { amount } = req.body;

    let transaction;


    const cleanAmount = parseFloat(parseFloat(amount).toFixed(2));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
    }



    const lockKey = `lock:withdraw:${userId}`;
    const isLocked = await redisClient.set(lockKey, "locked", {
        NX: true, //only set if key does not exist
        EX: 10, //lock expires in 10 seconds
    });

    if (!isLocked) {
        return res.status(429).json({ message: "Another transaction is in progress. Please wait." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // 3. Create transaction Pending
        transaction = await Transaction.create([{
            userId,
            type: "WITHDRAW",
            amount: cleanAmount,
            status: "PENDING"
        }], { session })

        // 4. ATOMIC UPDATE: Only subtract if balance >= cleanAmount
        const wallet = await Wallet.findOneAndUpdate(
            {
                userId: userId,
                balance: { $gte: cleanAmount } // Condition: Balance must be greater or equal
            },
            { $inc: { balance: -cleanAmount } }, // Subtract
            { new: true, session }
        );

        // 5. Check if the update actually happened (wallet will be null if balance was insufficient)
        if (!wallet) {
            throw new Error("Insufficient balance or wallet not found");
        }


        const finalBalance = wallet.balance.toFixed(2);

        // 6. Log the Transaction (For audit trail)
        transaction.status = "COMPLETED";
        transaction.balanceAfter = wallet.balance;
        await transaction.save({ session });
        await session.commitTransaction();
        session.endSession();

        // 7. Update Redis Balance Cache
        await redisClient.setEx(`balance:${userId}`, 3600, finalBalance);

        res.status(200).json({
            success: true,
            message: `Successfully withdrawn ₹${cleanAmount}`,
            newBalance: finalBalance
        });

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();

        if (transaction) {
            await Transaction.updateOne(
                { _id: transaction._id },
                { status: "FAILED", reason: err.message }
            ).catch(console.error); // Fallback for secondary failure
        }

        // Handle known errors properly
        const isInsufficient = err.message.includes("Insufficient");
        return res.status(isInsufficient ? 400 : 500).json({
            success: false,
            message: isInsufficient ? err.message : "Internal Server Error during withdrawal"
        });
    } finally {
        // 8. RELEASE LOCK, so that in future user can make transactions
        await redisClient.del(lockKey);
    }
};

module.exports.updateBalance = async ({ userId, amount, type, symbol, session }) => {
    // 1. Update wallet atomically within the session
    const wallet = await Wallet.findOneAndUpdate(
        { userId, balance: { $gte: type === "BUY" ? Math.abs(amount) : 0 } },
        { $inc: { balance: amount } },
        {
            new: true,
            session
        }
    );

    if (!wallet) {
        throw new Error("Insufficient funds or wallet not found");
    }

    // 2. Create transaction record
    await Transaction.create([{
        userId,
        type,
        amount: Math.abs(amount),
        balanceAfter: wallet.balance,
        status: "COMPLETED",
        symbol: symbol,
        orderId,
    }],
        { session }
    );

    return wallet;
};
