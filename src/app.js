const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // Highly recommended for logging requests
const helmet = require('helmet'); // Adds security headers

// Import Routes (Keeping naming consistent)
const authRoutes = require("./routes/AuthRoute");
const portfolioRoutes = require("./routes/PortfolioRoute"); // Combined Holdings/Positions
const orderRoutes = require("./routes/OrderRoute");        // Combined Orders/History
const watchlistRoutes = require("./routes/WatchlistRoute");
const fundRoutes = require("./routes/FundRoute");          // Combined Funds/History

const app = express();

// --- 1. Security & Global Middleware ---
app.use(helmet()); // Basic security headers
app.use(morgan('dev')); // Logs all requests to console
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Express 4.16+ has built-in JSON parsing; bodyParser.json() is no longer needed
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // For parsing form data if needed
app.use(cookieParser());

// --- 2. API Routes (Versioned) ---
// Prefixing with /api/v1 is a professional standard
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/portfolio`, portfolioRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/watchlist`, watchlistRoutes);
app.use(`${API_PREFIX}/funds`, fundRoutes);

// --- 3. Error Handling Middleware ---
// Catch-all for routes that don't exist
app.use((req, res, next) => {
    const error = new Error("Not Found");
    res.status(404);
    next(error);
});

// Global Error Handler (Prevents server crashes and hides stack traces in production)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;