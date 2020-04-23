let express = require('express');
let router = express.Router();

let database = require("../database")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CanvasReplace' });
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
