const express = require('express');
const { userVerification } = require('../middleware/AuthMiddleWare');

const router = express.Router();

// replaces only the changed filled rest remain the same
router.patch('/username/:id',userVerification,changeUsername);
router.patch('/password/:id',userVerification,changePassword)

module.exports = router;