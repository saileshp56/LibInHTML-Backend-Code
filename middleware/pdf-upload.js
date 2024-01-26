const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
// const { thumbnailUpload } = require("../controllers/books-controllers");

const MIME_TYPE_MAP_TEXT = {
  "text/plain": "txt",
};

const MIME_TYPE_MAP_PDF = {
  "application/pdf": "pdf",
};

// const name = uuidv4();

const pdfUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `./uploads/temp-pdf-storage/${uuid()}`);
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP_PDF[file.mimetype];
      cb(null, uuidv4() + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP_PDF[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

const txtUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `./uploads/temp-pdf-storage`);
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP_TEXT[file.mimetype];
      cb(null, uuidv4() + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP_TEXT[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

// exports.txtUpload = txtUpload;
// exports.pdfUpload = pdfUpload;
module.exports = pdfUpload;
