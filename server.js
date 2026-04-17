require("dotenv").config();

const cron = require("node-cron");
const { connectDB } = require('./src/config/db'); // Import modular DB connection
const app = require('./app'); // import express app
const { fetchStock } = require('./src/controllers/PortfolioController');
const PORT = process.env.PORT || 8000;

// Connect DB and start server
connectDB().then(async () => {

    fetchStock();
    setInterval(fetchStock, 5 * 60 * 1000);

    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`);
    });
}).catch((err) => {
    console.log("Failed to start server:", err);
});

