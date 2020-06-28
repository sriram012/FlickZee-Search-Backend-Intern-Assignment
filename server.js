//@ts-check
// main package imports here
const express = require("express");

// installed package imports here
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");

// mysql connection
const mysqlConn = require("./mysql_connection");

// instance of the main application
const app = express();

// CORS middlewares
var allowCrossDomain = function (req, res, next) {
    // website which can only access this backend server
    res.header("Access-Control-Allow-Origin", "*");

    // Request methods which are allowed to this backend server
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");

    // Request headers which are allowed to this backend server
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.header("Access-Control-Expose-Headers", "*");

    // Pass to next layer
    next();
};

// APPLY MIDDLEWARE HERE
// for converting the json part of the request body
app.use(express.json());
app.use(bodyParser.json());

// for securing the routes with adding headers
app.use(helmet());

// for allowing requests from the frontend or other domains
app.use(allowCrossDomain);

// for logging the infomation
app.use(morgan("tiny"));
console.log("Logging the data using morgan");


// ROUTES
// Search Route
app.use("/api/flickzee", require("./routes/search/index"));


const port = mysqlConn.port;
// The listening of the server
let server = app.listen(port, () => {
    console.log(`Server is up and running on port ${port}!!`);
});