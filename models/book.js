const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  genres: { type: String, required: true },
  thumbnail: { type: String, required: true },
  pages: { type: Number, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  filesArr: { type: [String], default: [] }, // Array of strings attribute
});

module.exports = mongoose.model("Book", bookSchema, "posts");
