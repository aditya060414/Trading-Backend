const { SignUp, Login, Logout, RefreshToken } = require("../controllers/AuthController");
const { userVerification } = require("../middleware/AuthMiddleWare");
const router = require("express").Router();

router.post("/signUp", SignUp);
router.post("/login", Login);
router.get("/verify", userVerification, (req, res) => {
  res.status(200).json({ authenticated: true, user: req.user });
});
router.post("/refresh", RefreshToken);
router.post("/logout", Logout);

module.exports = router;
