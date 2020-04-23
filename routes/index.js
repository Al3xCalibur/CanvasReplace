var express = require('express');
var router = express.Router();

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
    socket.emit("updateAll", "?")

    socket.on('change', (x, y, color) => {
      console.log(x, y, color)
    })

  })

  return router
}
