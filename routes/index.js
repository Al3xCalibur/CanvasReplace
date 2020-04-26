let express = require('express');
let router = express.Router();

let database = require("../database")

const width = process.env.WIDTH
const height = process.env.HEIGHT
const timerSeconds = process.env.TIMER

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
        let session = socket.request.session
        if(!(session.sid in io.sockets.connected)){
            session.sid = socket.id
            session.first = true
            session.save()
        } else {
            session.first = false
            session.save()
        }
        socket.lastUpdate = Date.now()
        io.emit("people", Object.keys(io.sockets.connected).length)
        database.all().then(
            (value) => {
                socket.emit("updateAll", width, height, timerSeconds, value)
            },
            console.log
        )

        socket.on('mobile', () => {console.log("A mobile user has connected")})
        socket.on('change', (x, y, color) => {
            if (session.first &&
                Date.now() - socket.lastUpdate > timerSeconds * 1000 &&
                Number.isInteger(x) && x >= 0 && x < width &&
                Number.isInteger(y) && y >= 0 && y < height
            ) {
                database.checkColor(x, y, color).then(
                    (check) => {
                        if (check){
                            database.insert(x, y, color).then(
                                () => {
                                    socket.broadcast.emit("update", x, y, color)
                                    socket.emit("updateYou", x, y, color, timerSeconds)
                                    socket.lastUpdate = Date.now()
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
            if(!(session.sid in io.sockets.connected)){
                session.sid = socket.id
                session.save()
            }
        })

        socket.on('disconnect', () => {
            io.emit('people', Object.keys(io.sockets.connected).length)
            if (socket.handshake.session) {
                delete socket.handshake.session.sid;
                delete socket.handshake.session.first
                session.save()
            }
        })

    })

    return router
}
