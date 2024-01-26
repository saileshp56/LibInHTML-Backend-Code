const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const Book = require("../models/book");

const crypto = require("crypto"); // to generate random tokens
const nodemailer = require("nodemailer"); // for sending emails

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Checking for existing user failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser && existingUser.isVerified) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  // Generate a verification token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  let createdUser = new User({
    name,
    email,
    admin: false,
    password: hashedPassword,
    books: [],
    isVerified: false,
    verificationToken: verificationToken,
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  if (existingUser && !existingUser.isVerified) {
    if (
      existingUser.verificationTokenExpires &&
      existingUser.verificationTokenExpires > Date.now()
    ) {
      // console.log("Unexpired yo");
      const error = new HttpError(
        "You have an unexpired verification token, wait for it to expire or find the verification token.",
        500
      );
      return next(error);
    }

    try {
      createdUser = await User.findOneAndUpdate(
        { email: email },
        {
          name: name,
          email: email,
          admin: false,
          password: hashedPassword,
          books: [],
          isVerified: false,
          verificationToken: verificationToken,
          verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        },
        {
          new: true,
          upsert: true, // this creates the object if it doesn't exist
        }
      );
    } catch (err) {
      // console.log(err, " look here yo");
      const error = new HttpError(
        "Signing up or updating user failed, please try again later.",
        500
      );
      return next(error);
    }
  }

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  // Send verification email
  let transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "NoReply@libinhtml.com",
      pass: "Mzn0@kI&NYys054i7sn!s0h",
    },
  });

  const verificationLink = `https://www.libinhtml.com/verify?token=${verificationToken}`;

  let mailOptions = {
    from: "NoReply@libinhtml.com",
    to: createdUser.email,
    subject: "Verify Your Email for LibinHTML.com - DO NOT REPLY",
    text:
      "Do not reply to this email, replies are not moderated and this account will NEVER ask for your password. This link expires in 24 hours. Click the link to verify your email: " +
      verificationLink,
  };

  try {
    transporter.sendMail(mailOptions);
  } catch (err) {
    const error = new HttpError(
      "Failed to send verification link, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    name: createdUser.name,
    userId: createdUser.id,
    email: createdUser.email,
  });
};

const verify = async (req, res, next) => {
  // console.log(req.body.token)
  const verifToken = req.body.token;
  console.log("We got ", verifToken);
  const user = await User.findOne({
    verificationToken: verifToken,
    verificationTokenExpires: { $gt: Date.now() },
  });

  const explainResult = await User.findOne({
    verificationToken: verifToken,
  }).explain();
  console.log("explained", explainResult);

  if (!user) {
    console.log("User not found");
    const tokenUser = await User.findOne({
      verificationToken: verifToken,
    });
    console.log("Looking just on token is ", tokenUser);
    const timeUser = await User.findOne({
      verificationTokenExpires: { $gt: Date.now() },
    });
    console.log("Looking just on time is ", timeUser);
    const error = new HttpError("Invalid or expired token.", 400);
    return next(error);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Email verification failed. Please try again.",
      500
    );
    return next(error);
  }
  // console.log("Verification done :)");
  res.status(200).json({ message: "Email verified successfully!" });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("A user does not exist with this email", 500);
    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }

  if (!isValidPassword) {
    // console.log("bad password");
    const error = new HttpError("Incorrect password", 500);
    return next(error);
  }
  if (!existingUser.isVerified) {
    // console.log("unverified acct");
    const error = new HttpError("Unverified account", 500);
    return next(error);
  }

  let token;
  try {
    if (existingUser.admin) {
      // console.log("signing with: lol_admin_user_lol");
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        "lol_admin_user_lol"
        // { expiresIn: "1h" }
      );
      // console.log("This is an administrator");
    } else {
      // console.log("signing with: lol_regular_user_lol");

      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        "lol_regular_user_lol"
        // { expiresIn: "6h" }
      );
    }
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

const getMyBooks = async (req, res, next) => {
  // console.log("getMyBooks -> Getting user specific books for uid: ",req.params.uid);

  const userId = req.params.uid; // Assuming you pass the userId as a request parameter

  try {
    // Fetch the User document from MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the Books from the Books collection based on their IDs in the User's books array
    // Exclude the filesArr field
    const books = await Book.find(
      { _id: { $in: user.posts } },
      { filesArr: 0 }
    );

    // Attach the populated books array to the User object
    user.books = books;

    //updates the thumbnail of each book to the url
    for (let i = 0; i < books.length; i++) {
      books[i].thumbnail = books[i].thumbnail.replace(
        /^.{15}/g,
        "https://ik.imagekit.io/5pthvuxet/"
      );
      //console.log(books[i].thumbnail);
    }
    //console.log(books);

    // Attach the modified User object to the request object
    req.user = user;

    res.json(user.books);

    // next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }

  // res.json({ lol: "nice job" });
};

// exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.getMyBooks = getMyBooks;
exports.verify = verify;
