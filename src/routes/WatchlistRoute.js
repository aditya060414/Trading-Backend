const express = require("express");
const router = express.Router();
const { userVerification } = require("../middleware/AuthMiddleWare")
const watchlistController = require("../controllers/watchlistController")

router.get("/get", userVerification, watchlistController.getWatchlist);
router.post("/add", userVerification, watchlistController.addToWatchlist);

module.exports = router;