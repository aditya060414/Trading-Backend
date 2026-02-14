const {SignUp, Login} = require("../Controllers/AuthController");
const { userVerification } = require("../Middlewares/AuthMiddleWare");
const router = require("express").Router();

router.post("/signUp",SignUp);
router.post("/login",Login);
router.get("/verify",userVerification);

module.exports = router;