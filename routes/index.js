let express = require('express');
let router = express.Router();

let database = require("../database")

const width = 1920
const height = 1080

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CanvasReplace', width: width, height: height });
});
/**
 * @param {Server} io
 * @returns {Router}
 */
module.exports = function(io){

  io.on('connection', (socket) => {
    database.all().then(
        (value) => {
          socket.emit("updateAll", value)
        },
        console.log
    )

    socket.on('change', (x, y, color) => {
      console.log(x, y, color)
    })

  })

  return router
}
