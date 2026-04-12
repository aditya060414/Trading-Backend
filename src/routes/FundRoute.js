const express = require('express');
const router = express.Router();
const fundsController = require('../controllers/fundsController');
const { userVerification } = require('../middleware/AuthMiddleWare');


router.get('/balance', userVerification, fundsController.getFunds);
router.get('/history', userVerification, fundsController.fundsHistory);
router.post('/add', userVerification, fundsController.addFunds);
router.post('/withdraw', userVerification, fundsController.withdrawFunds);

module.exports = router;