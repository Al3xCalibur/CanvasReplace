const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

let queries = {
    all: function() {
        return new Promise(function (resolve, reject) {
            db.all("SELECT * FROM pixels", [], (err, rows) => {
                if (err) {
                    reject(err)
                }
                resolve(rows)
            });
        })
    },
    insert: function(x, y, color){
        return new Promise(function(resolve, reject){
            db.run("REPLACE INTO pixels (x, y, color) VALUES (?,?,?)", [x, y, color], (err) => {
                if(err){
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }


}

module.exports = queries





