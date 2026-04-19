const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import Routes (Keeping naming consistent)
const authRoutes = require("./src/routes/AuthRoute");
const portfolioRoutes = require("./src/routes/PortfolioRoute"); // Combined Holdings/Positions
const orderRoutes = require("./src/routes/OrderRoute");        // Combined Orders/History
const watchlistRoutes = require("./src/routes/WatchlistRoute");
const fundRoutes = require("./src/routes/FundRoute");          // Combined Funds/History
const home = require("./src/routes/Home");
const app = express();

// --- 1. Global Middleware ---
const allowedOrigins = [
    "http://localhost:3000",
    "https://trading-dashboard-v2mi.onrender.com"
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression()); // Compress all responses

// Conditional logging format based on environment
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));



// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(globalLimiter);

// Express 4.16+ has built-in JSON parsing; bodyParser.json() is no longer needed
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data if needed
app.use(cookieParser());
app.set("trust proxy", 1);
// --- 2. API Routes (Versioned) ---
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}`, home);

// Auth-specific Rate Limiting (Stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Limit login/register attempts
    message: "Too many authentication attempts, please try again after 15 minutes"
});
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50
});
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/portfolio`, sensitiveLimiter, portfolioRoutes);
app.use(`${API_PREFIX}/orders`, sensitiveLimiter, orderRoutes);
app.use(`${API_PREFIX}/watchlist`, sensitiveLimiter, watchlistRoutes);
app.use(`${API_PREFIX}/funds`, sensitiveLimiter, fundRoutes);

// --- 3. Error Handling Middleware ---
// Catch-all for routes that don't exist
app.use((req, res, next) => {
    const error = new Error("Not Found");
    res.status(404);
    next(error);
});

// Global Error Handler (Prevents server crashes and hides stack traces in production)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || res.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;