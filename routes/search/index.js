//ts-check

const express = require("express");

// instance of new router
const router = express.Router();

router.post("/search", require("./functions/getSearchResults"));

module.exports = router;