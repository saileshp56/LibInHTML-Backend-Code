const express = require("express");
const checkAuth = require("../middleware/check-auth");
const path = require("path");

const router = express.Router();
const filesController = require("../controllers/files-controllers");

// router.use(checkAuth.checkUser);
router.get("/images/:filename", filesController.getThumbnail);
router.get("/books/:bid/:pn/:fid", filesController.getPageText);
router.get("/books/:bid", filesController.getBookInfo);
router.get("/books/search/:sv", filesController.getBookSearch);
router.get("/gallery", filesController.getGallery);
router.get("/gallery/:pid", filesController.getGalleryImage);

module.exports = router;
