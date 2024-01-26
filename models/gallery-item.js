const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const galleryItemSchema = new Schema({
  title: { type: String, required: true },
  commentary: { type: String, required: true },
  publisher: { type: String, required: true },
  thumnail: { type: String, required: true },
});

module.exports = mongoose.model("GalleryItem", galleryItemSchema, "gallery");
