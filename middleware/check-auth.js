const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

// const checkUser = (req, res, next) => {
//   if (req.method === "OPTIONS") {
//     return next();
//   }
//   try {
//     const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
//     if (!token) {
//       throw new Error("Authentication failed!");
//     }

//     const decodedToken =
//       jwt.verify(token, "lol_regular_user_lol") ||
//       jwt.verify(token, "lol_admin_lol");
//     console.log("User is a regular user or an admin");
//     req.userData = { userId: decodedToken.userId };
//     next();
//   } catch (err) {
//     const error = new HttpError(
//       "Authentication failed while checking for user!",
//       403
//     );
//     return next(error);
//   }
// };

const checkUser = (req, res, next) => {
  //if userCheck fails, we'll check for admin
  console.log("In checkUser");
  if (req.method === "OPTIONS") {
    console.log("Options found, user");

    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed due to bad token!");
    }
    // Try to verify with the first secret
    let decoded = jwt.verify(token, "lol_regular_user_lol");
    console.log("Success! The token was verified with the first secret.");
    res.json({ AuthorizationCheck: "Success" });
    // next();
    // Use the `decoded` payload as needed
  } catch (err) {
    console.log(
      "Error occured checking for user, sending request to admin now"
    );
    next();
  }
};

const checkAdmin = (req, res, next) => {
  console.log("In checkAdmin");
  if (req.method === "OPTIONS") {
    console.log("Options found, admin");
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authentication failed due to bad token!");
    }
    const decodedToken = jwt.verify(token, "lol_admin_user_lol");
    console.log("User is an admin");

    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError(
      "Authentication failed while checking for admin",
      403
    );
    console.log("Error occured checking for admin: ", err);

    return next(error);
  }
};

exports.checkUser = checkUser;
exports.checkAdmin = checkAdmin;
