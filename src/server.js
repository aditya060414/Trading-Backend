require("dotenv").config();

const mongoose = require("mongoose");
const app = require('./app'); //import express app

const PORT = process.env.PORT || 8000;

//Connect DB and start server

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`)
    })
}).catch((err) => {
    console.log("MongoDB connection error", err);
})

