var express = require('express');
var router = express.Router();

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
    socket.emit('updateAll', width, height)

    socket.on('change', (x, y, color) => {
      console.log(x, y, color)
    })

  })

  return router
}
