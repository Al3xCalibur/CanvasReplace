const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(process.env.DATABASE_PATH, sqlite3.OPEN_READWRITE, (err) => {
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
    },

    checkColor: function (x, y, color) {
        return new Promise(function (resolve, reject) {
            db.get("SELECT color FROM pixels WHERE x=? AND y=?", [x, y], (err, row) => {
                if(err){
                    reject(err)
                } else {
                    if (typeof row == "undefined") {
                        // pour la couleur de base, non stockée
                        if (color.toLowerCase() === "#ffffff" || color.toLowerCase() === "white") resolve(false)
                        else resolve(true)
                        // autrement :
                        // resolve(true)
                    }
                    else {
                        if (row.color === color) {
                            resolve(false)
                        } else resolve(true)
                    }
                }
            })
        })
    }

}

module.exports = queries





