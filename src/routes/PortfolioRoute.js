const express = require('express');
const router = express.Router();
const { userVerification } = require("../middleware/AuthMiddleWare")
const portfolioController = require("../controllers/PortfolioController")


router.get("/:id", userVerification, portfolioController.getPortfolio)

module.exports = router;