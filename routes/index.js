let express = require('express');
let router = express.Router();

let database = require("../database")

const width = 384
const height = 216

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
          socket.emit("updateAll", width, height, value)
        },
        console.log
    )

    socket.on('change', (x, y, color) => {
      database.insert(x, y, color).then(
          ()=>{
            io.emit("update", x, y, color)
          },
          console.log
      )
    })

  })

  return router
}
