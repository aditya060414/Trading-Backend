require("dotenv").config();

//import of database connection fuction
const { connectDB } = require('./src/config/db'); 
// import express app from app.js
const app = require('./app'); 
// defines port number initialized in .env file
const PORT = process.env.PORT || 8000;


// Connect DB and start server
connectDB().then(async () => {

    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`);
    });
}).catch((err) => {
    console.log("Failed to start server:", err);
});

