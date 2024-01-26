const express = require("express");
const { check } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const thumbnailUpload = require("../middleware/thumbnail-upload");
const pdfUpload = require("../middleware/pdf-upload");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const ImageKit = require("imagekit");

const router = express.Router();
const booksController = require("../controllers/books-controllers");

var imagekit = new ImageKit({
  "publicKey" : "public_Ec11qteGha8D3jfjgJ4mrPUElFs=", 
  "privateKey" : "private_+jYSXKkDPqYxW9sq74mwLuMdWx0=", 
  "urlEndpoint" : "https://ik.imagekit.io/5pthvuxet", 
});

// URL generation
var imageURL = imagekit.url({
  path : "/default-image.jpg",
});

// Upload function internally uses the ImageKit.io javascript SDK
function uploadImageKit(data, newName) {
  console.log("uploading to imagekit...")
  //console.log("file: "+ data);
  console.log("filename: "+ newName)
  imagekit.upload({
      file : data.stream,
      useUniqueFileName : false,
      fileName : newName,
      tags: [newName]
  }, function(err, result) {
      console.log(arguments);
      console.log(imagekit.url({
          src: result.url,
      }));
  })
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.mimetype === "application/pdf") {
      uploadPath = "./uploads/temp-pdf-storage";
    } else if (file.mimetype.startsWith("image/")) {
      uploadPath = "./uploads/images";
    }
    // fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Using uuid to generate a unique file name
    let uniqueName = uuidv4() + path.extname(file.originalname);
    if(file.mimetype.startsWith("image/")){
      uploadImageKit(file, uniqueName); //to upload to imagekit
      
    }
    
    cb(null, uniqueName);
  },
});






const upload = multer({ storage: storage });

// router.use(checkAuth.checkAdmin);

router.get("/explore-books", booksController.exploreBooks);

router.post(
  "/upload-book",
  checkAuth.checkAdmin,
  upload.fields([{ name: "pdf", maxCount: 1 }, { name: "image" }]),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 2 }),
    check("author").not().isEmpty(),
    check("genres").not().isEmpty(),
  ],
  booksController.uploadPdf,
  booksController.uploadBook
);
router.delete(
  "/delete/:bid/:uid",
  checkAuth.checkAdmin,
  booksController.deleteBook
);

module.exports = router;
