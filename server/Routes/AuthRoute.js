const {SignUp, Login,Logout} = require("../Controllers/AuthController");
const { userVerification } = require("../Middlewares/AuthMiddleWare");
const router = require("express").Router();

router.post("/signUp",SignUp);
router.post("/login",Login);
router.get("/verify",userVerification);
router.post("/logout",Logout);

module.exports = router;