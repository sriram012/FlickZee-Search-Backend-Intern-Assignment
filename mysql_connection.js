var mysql = require('mysql');

// Creating mysql server
let port = parseInt(process.env.PORT, 10) || 8000;
let connection;
var db_config = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'flickzee'
};

connection = mysql.createConnection(db_config);
connection.connect((error) => {
    if (error) {
        console.log('ERROR: ' + error);
    }
    else {
        console.log('Connected to mysql server!!');
    }
})

module.exports = {
    port: port,
    connection: connection
}