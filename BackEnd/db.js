const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password:'',
    database:'royal_rokok'
});

db.connect((err) => {
    if (err){
        console.error('Error connecting to the database:', err);
    }
    else {
        console.log('Database connected successfully.');
    }
});

module.exports = db;