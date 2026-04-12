require("dotenv").config();

const { connectDB } = require('./src/config/db'); // Import modular DB connection
const app = require('./app'); // import express app

const PORT = process.env.PORT || 8000;

// Connect DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`);
    });
}).catch((err) => {
    console.log("Failed to start server:", err);
});

