const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");

const adminController = require("../controllers/admin-controllers");

const router = express.Router();

router.use(checkAuth.checkAdmin);
router.get("/getUsers", adminController.getUsers);

module.exports = router;
