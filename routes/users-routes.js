const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");

const usersController = require("../controllers/users-controllers");

const router = express.Router();

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("name").isLength({ min: 4 }),
    check("email").normalizeEmail({ gmail_remove_dots: false }).isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signup
);

router.post("/verify", usersController.verify);

router.post("/login", usersController.login);

router.get(
  "/get-my-books/:uid",
  checkAuth.checkUser,

  usersController.getMyBooks
);

module.exports = router;
