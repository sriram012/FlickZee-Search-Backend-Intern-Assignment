var soundex = require('soundex-code');
var levenshtein = require('fast-levenshtein');
var stopword = require('stopword');

const mysqlConn = require("../../../mysql_connection")

const conn = mysqlConn.connection;

module.exports = {
    'soundex': soundex,
    'levenshtein': levenshtein,
    'stopword': stopword,
    'conn': conn
}