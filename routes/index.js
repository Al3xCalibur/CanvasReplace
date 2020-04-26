let express = require('express');
let router = express.Router();

let database = require("../database")

const width = process.env.WIDTH
const height = process.env.HEIGHT
const timerSeconds = process.env.TIMER

const connected = {}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'CanvasReplace', width: width, height: height, timer: timerSeconds});
});
/**
 * @param {Server} io
 * @returns {Router}
 */
module.exports = function (io) {

    io.on('connection', (socket) => {

        socket.on('login', (uid) => {
            if (uid !== undefined) {
                socket.uid = uid
                if (!(uid in connected)) {
                    connected[uid] = {socket: socket, lastUpdate: Date.now() - 60 * 60 * 1000}
                } else {
                    connected[uid].socket = socket
                }
                io.emit("people", Object.keys(io.sockets.connected).length)
                database.all().then(
                    (value) => {
                        console.log(timerSeconds, (Date.now() - connected[uid].lastUpdate)/1000)
                        socket.emit("updateAll", width, height,
                            Math.round(Math.max(0, timerSeconds - (Date.now() - connected[uid].lastUpdate)/1000)), value)
                    },
                    console.log
                )
            } else {
                socket.disconnect()
            }
        })

        socket.on('mobile', () => {
            console.log("A mobile user has connected")
        })

        socket.on('change', (x, y, color) => {
            if (connected[socket.uid] &&
                Date.now() - connected[socket.uid].lastUpdate > timerSeconds * 1000 &&
                Number.isInteger(x) && x >= 0 && x < width &&
                Number.isInteger(y) && y >= 0 && y < height
            ) {
                database.checkColor(x, y, color).then(
                    (check) => {
                        if (check) {
                            database.insert(x, y, color).then(
                                () => {
                                    socket.broadcast.emit("update", x, y, color)
                                    socket.emit("updateYou", x, y, color, timerSeconds)
                                    connected[socket.uid].lastUpdate = Date.now()
                                },
                                console.log
                            )
                        }
                    },
                    console.log
                )
            }
        })

        socket.on('reconnect', () => {

        })

        socket.on('disconnect', () => {
            io.emit('people', Object.keys(io.sockets.connected).length)

            setTimeout(() => {
                if (connected[socket.uid] && connected[socket.uid].socket === socket)
                    delete connected[socket.uid]
            }, timerSeconds * 1000)

        })

    })

    return router
}
