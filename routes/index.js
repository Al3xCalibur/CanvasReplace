let express = require('express');
let router = express.Router();

let database = require("../database")

const width = process.env.WIDTH
const height = process.env.HEIGHT
const timerSeconds = process.env.TIMER
const discord = process.env.DISCORD

const colors = new Set(['#000000', '#404040', '#a0a0a0', '#ffffff', '#a05020', '#542100', '#800000', '#ff0000', '#ff6000',
    '#ffa000', '#ffff00', '#b0ff00', '#007000', '#40c000', '#00ffa0', '#00d0ff', '#0080ff', '#0040ff', '#000040',
    '#8060ff', '#8000ff', '#ff30ff', '#ff90ff', '#ffffb0'])

const bans = new Set(process.env.BANS)

const connected = {}

const ips = {}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'CanvasReplace', width: width, height: height, timer: timerSeconds, colors: Array.from(colors), discord: discord});
});

router.get('/json', function (req, res, next) {
    database.all().then(
        (value) => {
            let r
            if(value.length <= width*height/4)
                r = {array: false, width: width, height: height, value: value}
            else
                r = {array: true, width: width, height: height, value: databaseValueToArray(value)}
            res.json(r)
        },
        console.log
    )
})

/**
 * @param {Server} io
 * @returns {Router}
 */
module.exports = function (io) {
    let ioCanvas = io.of('/canvas')
    ioCanvas.on('connection', (socket) => {
        let ip = socket.request.connection.remoteAddress
        if(bans.has(ip)){
            socket.disconnect()
        }
        if(ip in ips){
            ips[ip].total++
        } else {
            ips[ip] = {total: 0}
        }
        if(ips[ip].total > 5) {
            console.log(ip, ips[ip])
        }
        if(ips[ip].total > 12) {
            console.log("ban "+ip, ips[ip])
            // socket.disconnect()
        }
        socket.on('login', (uid) => {
            if (uid !== undefined) {
                socket.uid = uid
                if (!(uid in connected)) {
                    connected[uid] = {socket: socket, lastUpdate: Date.now() - 60 * 60 * 1000}
                } else {
                    connected[uid].socket = socket
                }
                ioCanvas.emit("people", Object.keys(ioCanvas.connected).length)
                database.all().then(
                    (value) => {
                        let res
                        if(value.length <= width*height/4)
                            res = {array: false, value:value}
                        else
                            res = {array: true, value:databaseValueToArray(value)}
                        socket.emit("updateAll", width, height,
                            Math.round(Math.max(0, timerSeconds - (Date.now() - connected[uid].lastUpdate)/1000)),
                            res)
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
                (Date.now() - connected[socket.uid].lastUpdate > timerSeconds * 1000 || socket.uid === process.env.ADMIN) &&
                Number.isInteger(x) && x >= 0 && x < width &&
                Number.isInteger(y) && y >= 0 && y < height &&
                colors.has(color)
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
            ioCanvas.emit('people', Object.keys(ioCanvas.connected).length)
            if(ips[ip]){
                ips[ip].total--
                if(ips[ip].total === 0)
                    delete ips[ip]
            }
            setTimeout(() => {
                if (connected[socket.uid] && connected[socket.uid].socket === socket)
                    delete connected[socket.uid]
            }, timerSeconds * 1000)

        })

    })

    return router
}

function databaseValueToArray(value) {
    let result = Array.from(Array(parseInt(height)), () => new Array(parseInt(width)))
    for(let v of value) {
        result[parseInt(v.y)][parseInt(v.x)] = v.color
    }
    return result
}
