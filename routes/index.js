let express = require('express');
let router = express.Router();

let database = require("../database")

const width = 384
const height = 216

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'CanvasReplace', width: width, height: height});
});
/**
 * @param {Server} io
 * @returns {Router}
 */
module.exports = function (io) {

    io.on('connection', (socket) => {
        socket.lastUpdate = Date.now()
        io.emit("people", Object.keys(io.sockets.connected).length)
        database.all().then(
            (value) => {
                socket.emit("updateAll", width, height, value)
            },
            console.log
        )

        socket.on('change', (x, y, color) => {
            if (Date.now() - socket.lastUpdate > 5 * 1000 &&
                Number.isInteger(x) && x >= 0 && x < width &&
                Number.isInteger(y) && y >= 0 && y < height
            ) {
                database.insert(x, y, color).then(
                    () => {
                        socket.broadcast.emit("update", x, y, color)
                        socket.emit("updateYou", x, y, color)
                        socket.lastUpdate = Date.now()
                    },
                    console.log
                )
            }
        })

        socket.on('disconnect', () => {
            io.emit('people', Object.keys(io.sockets.connected).length)
        })

    })

    return router
}
