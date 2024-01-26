const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  admin: { type: Boolean, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },

  //   file : { type: String, required: true },
  posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Book" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
