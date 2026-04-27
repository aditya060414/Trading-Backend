// import express to create server
const express = require('express');
// cors allows request from different origins
const cors = require('cors');
// it is used to parse cookies and within cookie token is stored which is then used for client verification
const cookieParser = require('cookie-parser');
// logs all the request coming on the backend and from where
const morgan = require('morgan');
// it is used to secure backend by setting http headers
const helmet = require('helmet');
// compress large files and make sure of less bandwidth to be used while data transfer
const compression = require('compression');
// limits number of request coming at backend, this prevents crashing of server with too many requests
const rateLimit = require('express-rate-limit');

// import of routes
const authRoutes = require("./src/routes/AuthRoute");
const portfolioRoutes = require("./src/routes/PortfolioRoute");
const orderRoutes = require("./src/routes/OrderRoute");
const watchlistRoutes = require("./src/routes/WatchlistRoute");
const fundRoutes = require("./src/routes/FundRoute");
const home = require("./src/routes/Home");
const userUpdateRoutes = require("./src/routes/UserUpdate");

// instance of express
const app = express();

// these are the allowed origins, which can interact with backend other requests coming on these route will be blocked
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
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true
}));

// this does not allow resources sharing from the origin which does not have access or are restricted
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// compress large requests 
app.use(compression());

// the request are different in development and production level, so to insure security format is used and logged using morgan
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));



// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000, // Limit each IP to 100 requests per window at production level
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(globalLimiter);

// send and recieve json format data
app.use(express.json());
// parsing form data
app.use(express.urlencoded({ extended: true }));
// parsing cookies
app.use(cookieParser());

// when deployed make sure to get client requests when behind a proxy 
// request flow after deployment  ( Client → Proxy → Your Express App )
app.set("trust proxy", 1);


// API Routes (Versioned)
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}`, home);

// Auth-specific Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Limit login/register attempts
    message: {
        success: false,
        message: "Too many authentication attempts, please try again after 15 minutes"
    }
});

const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: "High traffic detected. Please slow down and try again later."
    }
});

app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/portfolio`, sensitiveLimiter, portfolioRoutes);
app.use(`${API_PREFIX}/orders`, sensitiveLimiter, orderRoutes);
app.use(`${API_PREFIX}/watchlist`, sensitiveLimiter, watchlistRoutes);
app.use(`${API_PREFIX}/funds`, sensitiveLimiter, fundRoutes);
app.use(`${API_PREFIX}/update`, sensitiveLimiter, userUpdateRoutes);

// Error Handling Middleware
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