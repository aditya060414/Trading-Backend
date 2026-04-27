const express = require('express');
const { userVerification } = require('../middleware/AuthMiddleWare');
const { changeUsername, changePassword } = require('../controllers/updateControllers');
const router = express.Router();

// replaces only the changed filled rest remain the same
router.patch('/username', userVerification, changeUsername);
router.patch('/password', userVerification, changePassword)

module.exports = router;