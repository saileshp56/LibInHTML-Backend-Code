const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const mongoose = require("mongoose");

const booksRoutes = require("./routes/books-routes");
const usersRoutes = require("./routes/users-routes");
const adminRoutes = require("./routes/admin-routes");
const fileRoutes = require("./routes/file-routes");
const HttpError = require("./models/http-error");
const serverless = require("serverless-http");

const app = express();
app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

//   next();
// });
app.use(bodyParser.json());

app.use("/users", usersRoutes);

app.use("/books", booksRoutes);
app.use("/admins", adminRoutes);
app.use("/files", fileRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv...`
  )
  .then(() => {
    console.log("Server starting on port ????");
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });

// module.exports.handler = serverless(app);
