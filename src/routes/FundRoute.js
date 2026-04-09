const express = require('express');
const router = express.Router();
const fundsController = require('../controllers/fundsController');

router.get('/getFunds',fundsController.getFunds);
router.get('fundsHistory',fundsController.fundsHistory);
router.post('/addFunds',fundsController.addFunds);
module.exports = router;