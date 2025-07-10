const { validationResult } = require("express-validator");
const { connectMainDB } = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const getLogin = async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    res.render("./auth/login", { layout: "layouts/auth" });
  } catch (error) {
    next(error);
  }
};

const getRegister = async (req, res, next) => {
  try {
    res.render("./auth/register", { layout: "layouts/auth" });
  } catch (error) {
    next(error);
  }
};

const getResetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.render("./auth/reset_password", {
        title: "Reset Password",
        noindex: true,
        layout: "layouts/auth",
      });
    }
    const db = await connectMainDB();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (user) {
      return res.render("./auth/new_password", {
        title: "Reset Password",
        token: token,
        noindex: true,
        layout: "layouts/auth",
      });
    }

    return res.render("./auth/reset_password", {
      title: "Reset Password",
      noindex: true,
      layout: "layouts/auth",
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors.array().map((e) => e.msg)
      );
      return res.redirect("/auth/register");
    }

    const { username, email, password } = req.body;
    const db = await connectMainDB();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      req.flash("error", "Email already in use");
      return res.redirect("/auth/register");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const apiKey = crypto.randomBytes(16).toString("hex");

    const result = await db.collection("users").insertOne({
      username,
      email,
      password: hashedPassword,
      apiKey,
    });

    const newUser = await db
      .collection("users")
      .findOne({ _id: result.insertedId });

    // Create user-specific DB
    /*const userDbName = `userdb_${newUser._id}`;
    await client.db(userDbName).command({ ping: 1 }); // initialize DB
    */

    // Auto-login using Passport
    req.login(newUser, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
};

const sendResetPasswordLink = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors.array().map((e) => e.msg)
      );
      return res.redirect("/auth/reset-password");
    }
    const db = await connectMainDB();
    const usersCollection = db.collection("users");
    const { email } = req.body;

    const user = await usersCollection.findOne({ email });
    if (!user) {
      req.flash("error", "No user found with that email.");
      return res
        .status(400)
        .json({ message: "No user found with that email." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiration = Date.now() + 3600000; // 1 hour

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { resetToken: token, resetTokenExpiration: expiration },
      }
    );

    // Send email (Configure your SMTP settings)
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL,
        pass: process.env.EMAIL_CREDENTIAL,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.SUPPORT_EMAIL,
      subject: "Password Reset",
      text:
        `Please click the following link to reset your password: \n\n` +
        `${process.env.PW_RESET_BASE_URL}/auth/reset-password/${token}\n\n` +
        `If you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
    req.flash(
      "success",
      "Password reset email sent. Check your inbox and/or spam folders. Emails may take a few minutes to process."
    );
    return res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors.array().map((e) => e.msg)
      );
      return res.redirect("/auth/login");
    }

    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    const db = await connectMainDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/auth/reset-password");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    if (!token || !password) {
      req.flash("error", "Invalid request. Missing token or password.");
      return res.redirect("/auth/reset-password");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiration: "" },
      }
    );

    req.flash("success", "Your password has been reset successfully.");
    return res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

const logout = (req, res, next) => {
  try {
    req.logout((err) => {
      if (err) return res.status(500).send("Error logging out.");
      res.redirect(req.get("Referrer") || "/");
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogin,
  getRegister,
  getResetPassword,
  register,
  sendResetPasswordLink,
  resetPassword,
  logout,
};
