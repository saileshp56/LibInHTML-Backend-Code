const HttpError = require("../models/http-error");
const User = require("../models/user");
const Book = require("../models/book");
const GalleryItem = require("../models/gallery-item");

const fs = require("fs");
const path = require("path");

const getThumbnail = async (req, res, next) => {
  console.log("\nGetting thumbnail");
  const filename = req.params.filename;
  console.log("   filename: " + filename);
  const imagePath = "https://ik.imagekit.io/5pthvuxet/" + req.params.filename;
  console.log("   Fetching from: " + imagePath);

  // fs.access(""req.params.filename, fs.constants.F_OK, (err) => {
  //   if (err) {
  //     // File not found
  //     console.error(err);
  //     return res.status(404).json({ message: "Image not found" });
  //   }

  //   // Stream the image file as the response
  //   res.sendFile(imagePath);

  // });

  function isImage(url) {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg|JPG|JPEG|PNG|WEBP|AVIF|GIF|SVG)$/.test(
      url
    );
  }

  //console.log("   file: " + req.params.filename);
  if (isImage(imagePath)) {
    res.redirect(imagePath);
  } else {
    //console.log(isImage("https://ik.imagekit.io/5pthvuxet/"+ req.params.filename));
    return res.status(404).json({ message: "Image not found" });
  }
};

const getGallery = async (req, res, next) => {
  try {
    const galleries = await GalleryItem.find();
    res.json(galleries);
  } catch (error) {
    return res.status(404).json({
      message:
        "An error occured while trying to load the gallery. Please try again later.",
    });
  }
};
const getGalleryImage = async (req, res, next) => {
  try {
    const galleryImage = await GalleryItem.findById(req.params.pid);
    res.json(galleryImage);
  } catch (error) {
    return res.status(404).json({
      message:
        "An error occured while trying to load the image. Please try again later.",
    });
  }
};

const getPageText = async (req, res, next) => {
  const bookId = req.params.bid;
  const pageNumber = req.params.pn;
  console.log(
    bookId,
    " @",
    pageNumber,
    " and here is full req.params:",
    req.params
  );

  let book;
  try {
    book = await Book.findById(bookId);
  } catch (err) {
    console.log("Error finding book", err);
    return res.status(500).json({ message: "Error finding book" });
  }

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (pageNumber <= 0 || pageNumber > book.filesArr.length) {
    return res.status(404).json({ message: "Page not found" });
  }

  const pageText = book.filesArr[pageNumber - 1];

  res.status(200).json({ content: pageText });
};

const getBookInfo = async (req, res, next) => {
  try {
    // Fetch the book from the database, excluding the filesArr field
    const book = await Book.findById(req.params.bid, { filesArr: 0 });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    //updates the url for the thumbnail
    console.log(book.thumbnail);
    book.thumbnail = book.thumbnail.replace(
      /^.{15}/g,
      "https://ik.imagekit.io/5pthvuxet/"
    );
    console.log(book.thumbnail);

    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBookSearch = async (req, res, next) => {
  const searchValue = req.params.sv;
  console.log("In book search", searchValue);

  try {
    const books = await Book.find(
      {
        $or: [
          { title: { $regex: new RegExp(searchValue, "i") } },
          { author: { $regex: new RegExp(searchValue, "i") } },
        ],
      },
      { filesArr: 0 } // Exclude the filesArr field
    );

    if (!books || books.length === 0) {
      return res.status(404).json({ message: "Books not found." });
    }

    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: "Fetching books failed." });
  }
};

exports.getThumbnail = getThumbnail;
exports.getPageText = getPageText;
exports.getBookInfo = getBookInfo;
exports.getBookSearch = getBookSearch;
exports.getGallery = getGallery;
exports.getGalleryImage = getGalleryImage;
