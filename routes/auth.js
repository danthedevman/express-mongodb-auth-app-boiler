const express = require("express");
const router = express.Router();
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const {
  getLogin,
  getRegister,
  getResetPassword,
  register,
  logout,
  sendResetPasswordLink,
  resetPassword,
} = require("../controllers/auth");
router.get("/login", getLogin);
router.get("/register", getRegister);
router.get("/reset-password/:token?", getResetPassword);
router.get("/logout", logout);
router.post("/send-reset-link",  body("email").isEmail().withMessage("Valid email required"),sendResetPasswordLink)
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
    badRequestMessage: 'Please enter a valid email and password.'
  })
);
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 chars"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords must match"),
  ],
  register
);

router.post("/reset-password/:token", resetPassword);

module.exports = router;
