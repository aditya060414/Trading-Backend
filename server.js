require("dotenv").config();

//import of database connection fuction
const { connectDB } = require('./src/config/db'); 
// import express app from app.js
const app = require('./app'); 
// it is function which is used to fetch stock data from the api and update the database.
const { fetchStock } = require('./src/controllers/PortfolioController');
// defines port number initialized in .env file
const PORT = process.env.PORT || 8000;

// Connect DB and start server
connectDB().then(async () => {

    await fetchStock();

    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`);
    });
}).catch((err) => {
    console.log("Failed to start server:", err);
});

