const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { userVerification } = require('../middleware/AuthMiddleWare');

router.post('/placeOrder',userVerification,orderController.placeOrder);

module.exports = router;