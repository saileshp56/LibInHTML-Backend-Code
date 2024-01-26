const Book = require("../models/book");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");

const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const path = require("path");
const ImageKit = require("imagekit");

var numPages = 0;
const rimraf = require("rimraf");

var imagekit = new ImageKit({
  publicKey: "",
  privateKey: "",
  urlEndpoint: "",
});

function formatDialogue(input) {
  const oldArr = input.split("\n").filter((element) => element);
  const newArr = [];
  //   console.log(oldArr);

  for (let i = 0; i < oldArr.length; i++) {
    const currentElement = oldArr[i];
    const nextElement = oldArr[i + 1];

    // if (!nextElement || !/^[a-z]/.test(nextElement)) {
    //   newArr.push(currentElement);
    // }
    if (
      currentElement.endsWith(".") ||
      currentElement.endsWith(":") ||
      currentElement.endsWith("!") ||
      currentElement.endsWith("?") ||
      currentElement.endsWith(". ") ||
      currentElement.endsWith(": ") ||
      currentElement.endsWith("! ") ||
      currentElement.endsWith("? ") ||
      !isNaN(parseInt(currentElement))
    ) {
      newArr.push(currentElement);
      newArr.push("\n");
    } else {
      if (currentElement.endsWith(" ")) {
        newArr.push((currentElement + " ").trim());
      } else {
        newArr.push(currentElement.trim());
      }
    }
  }
  //   console.log("NEW: ", newArr);
  return newArr.reduce((prev, curr, i, arr) => {
    if (i === 0) {
      return curr;
    } else if (
      prev.endsWith(" ") ||
      curr.startsWith(" ") ||
      arr[i - 1] === "\n"
    ) {
      return prev + curr;
    } else {
      return prev + " " + curr;
    }
  }, "");
}

const uploadPdf = (req, res, next) => {
  console.log("in uploadPdf right now");

  const dataBuffer = fs.readFileSync(req.files.pdf[0].path);

  pdfParse(dataBuffer)
    .then(function (data) {
      let str = data.text;
      let textArray = [];
      for (let i = 0; i < str.length; i += 2500) {
        // Apply formatDialogue to each text chunk
        textArray.push(formatDialogue(str.substring(i, i + 2500)));
      }

      numPages = textArray.length;
      req.textArray = textArray;

      fs.unlink(req.files.pdf[0].path, (err) => {
        console.log("any error deleting pdf?", err);
      });

      next();
    })
    .catch((err) => {
      return next(new HttpError("Cannot parse PDF", 422));
    });
};

const uploadBook = async (req, res, next) => {
  console.log("in uploadBook now");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { title, description, author, genres } = req.body;

  let createdBook = new Book({
    title,
    description,
    author,
    genres,
    thumbnail: req.files.image[0].path,
    pages: numPages,
    creator: req.body.userId,
    filesArr: req.textArray, // Storing the parsed text here
  });

  console.log("image: " + req.files.image[0].path);
  const imagePath = req.files.image[0].path;
  console.log("book saved hehe");
  fs.unlink(`./${imagePath}`, (err) => {
    if (err) {
      console.log("image not found");
      res
        .status(500)
        .json({ imageError: "Failed to clean up local storage image" });
    }
  });

  let user;
  try {
    user = await User.findById(req.body.userId);
  } catch (err) {
    console.log("was trying to find", req.body.userId, "err is", err);
    const error = new HttpError("Finding user failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdBook.save({ session: sess });
    user.posts.push(createdBook);
    await user.save({ session: sess });
    // throw Error("error for testing purposes - dev0");
    await sess.commitTransaction();
  } catch (err) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });

    console.log("was trying to add to", req.body.userId, "err is", err);
    const error = new HttpError(
      "Putting book in user's array failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json(createdBook);
};

const deleteBook = async (req, res, next) => {
  console.log("In delete");

  const bookId = req.params.bid;
  const userId = req.params.uid;

  let book;
  try {
    book = await Book.findById(bookId).populate("creator");
    if (!book) {
      console.log("Book not found");
      return res.status(404).json({ message: "Book not found" });
    }
  } catch (err) {
    const error = new HttpError("Could not delete Book.", 500);
    return next(error);
  }

  console.log("Found book", book);

  if (book.creator.id.toString() !== userId) {
    console.log("Bad user id");
    const error = new HttpError(
      "You are not allowed to delete this book.",
      401
    );
    return next(error);
  }

  const imagePath = book.thumbnail;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    book.creator.posts.pull(book);
    await book.creator.save({ session: sess });
    await Book.deleteOne({ _id: bookId }, { session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log("error occured: ", err);
    const error = new HttpError(
      "Something went wrong, could not delete book.",
      500
    );
  }
  // fs.unlink(`./${imagePath}`, (err) => {
  //   if (err) {
  //     console.log("image not found");
  //     res.status(500).json({ imageError: "Failed to delete image" });
  //   }
  // });

  // fs.rmSync(
  //   `./uploads/book-files/${book.folder}`,
  //   { recursive: true, force: true },
  //   (err) => {
  //     if (err) {
  //       console.log(err);
  //       res.status(500).json({ folderError: "Failed to delete pdf" });
  //     }
  //   }
  // );

  //to delete from imagekit (not completed yet)

  //trims imagePath to get image name then uses URL enpoint to fetch
  let imageOnIK = imagePath;
  let fileID;
  imageOnIK = imageOnIK.replace(/^.{15}/g, "");
  let imageURL = "https://ik.imagekit.io/5pthvuxet/" + imageOnIK;
  console.log(imageOnIK);

  //gets image meta deta from URL because can't delete photos with URL (need file ID)
  imagekit.listFiles(
    {
      tags: [imageOnIK],
    },
    function (error, result) {
      if (error) {
        console.log(error);
      } else {
        fileID = result[0].fileId;
        fileID.toString();
        console.log("image to be deleted: " + fileID);
        console.log(
          "Found at: " + "https://ik.imagekit.io/5pthvuxet/" + fileID
        );
        //to delete image from imagekit
        imagekit
          .deleteFile(fileID)
          .then((response) => {
            console.log("Deleted from ImageKit - success");
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
  );

  console.log("All good, done here");
  res.status(200).json({ message: "Book deleted" });
};

// const exploreBooks = async (req, res, next) => {
//   console.log("in explore books");
//   try {
//     const books = await Book.aggregate([
//       { $sample: { size: 10 } },
//       { $project: { filesArr: 0 } }, // Exclude the filesArr field
//     ]);

//     //updates to URL rather than directory
//     for (let i = 0; i < books.length; i++) {
//       books[i].thumbnail = books[i].thumbnail.replace(
//         /^.{15}/g,
//         "https://ik.imagekit.io/5pthvuxet/"
//       );
//       //console.log(books[i].thumbnail);
//     }
//     // console.log(books);
//     res.json(books);
//   } catch (err) {
//     const error = new HttpError("Something went wrong: " + err, 500);
//     return next(error);
//   }
// };

const exploreBooks = async (req, res, next) => {
  try {
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;

    // console.log("Gotta skip", skip);
    // Fetch books in order using the skip parameter for pagination
    const books = await Book.find().skip(skip).limit(10).select("-filesArr");

    for (let i = 0; i < books.length; i++) {
      books[i].thumbnail = books[i].thumbnail.replace(
        /^.{15}/g,
        "https://ik.imagekit.io/5pthvuxet/"
      );
    }

    res.json(books);
  } catch (err) {
    const error = new HttpError("Something went wrong: " + err, 500);
    return next(error);
  }
};

exports.uploadBook = uploadBook;
exports.uploadPdf = uploadPdf;
exports.deleteBook = deleteBook;
exports.exploreBooks = exploreBooks;
