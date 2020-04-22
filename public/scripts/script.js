const canvas = document.getElementById('drawing')
const ctx = canvas.getContext('2d')
const size = 5


window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.imageSmoothingEnabled = false
        draw()
}


let scale = 1
let translateX = 0
let translateY = 0

ctx.lineWidth = 2
let actualColor = "black"
let moved = false

class Rectangle {
	constructor(x, y, color){
  	this.x = x
    this.y = y
    this.color = color
  }
}

class Vector {
  constructor(x, y){
    this.x = x
    this.y = y
  }

  screenToCanvas(){

  }

  screenToWorld(){

  }

  worldToGrid(){

  }

  canvasToWorld(){
    
  }
}

let rectangles = []

canvas.addEventListener('click', mouseClicked)
window.addEventListener('wheel', scroll)
canvas.addEventListener('mousemove', moveCanvas)


function mouseClicked(e){
  if(!moved){
    let x,y
    ({x, y} = screenToWorld(e.x, e.y));
    ({x, y} = worldToGrid(x, y));
    if(x >= 0 && x < ctx.canvas.width &&
      y >= 0 && y < ctx.canvas.height 
    ){
      ctx.fillStyle = actualColor
      ctx.fillRect(x, y, size, size)
      rectangles.push(new Rectangle(x, y, actualColor))
    }
  }
}

function changeColor(color){
  actualColor = color
}

function scroll(e){
  e.preventDefault()
  let relativeScale = 1 - e.deltaY * 0.01
  if(scale*relativeScale >= 1 && scale*relativeScale <= 10){
    let x = e.x - canvas.offsetLeft, y = e.y - canvas.offsetTop

    let previous = scale
    scale *= relativeScale

    translateX -= x * (1 / scale - 1 / previous)
    translateY -= y * (1 / scale - 1 / previous)
    if(translateX < 0) translateX = 0
    if(translateX > ctx.canvas.width) translateX = ctx.canvas.width
    if(translateY > ctx.canvas.height) translateY = ctx.canvas.height
    if(translateY < 0) translateY = 0
    updateTransform()
    draw()
  }
}

function moveCanvas(e) {
  if (e.buttons == 0) return moved = false;
//corriger l'affichage: il manque des bouts?
  if (translateX-e.movementX/scale > -10 && translateX-e.movementX/scale < ctx.canvas.width*(1-1/scale)+50 && translateY-e.movementY/scale > -10 && translateY-e.movementY/scale < ctx.canvas.height*(1-1/scale) +50) {
    translateX -= e.movementX / scale
    translateY -= e.movementY / scale
    updateTransform()
    draw()
  }
  moved = true

}

function draw(){
  let world = canvasToWorld()
  ctx.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
	for(let rectangle of rectangles){
    if(rectangle.x >= world.x - size && rectangle.x <= world.x + world.width && 
      rectangle.y >= world.y - size && rectangle.y <= world.y + world.height
    ) {
      ctx.fillStyle = rectangle.color
      ctx.fillRect(rectangle.x, rectangle.y, size, size)
    }
  }
}

function screenToWorld(screenX, screenY){
	let posX = screenX - canvas.offsetLeft
  let posY = screenY - canvas.offsetTop
	let x = posX/scale + translateX
  let y = posY/scale + translateY
  return new Vector(x, y)
}

function worldToGrid(x, y){
  return {x: Math.floor(x/size)*size, y: Math.floor(y/size)*size}
}

function updateTransform(){
  ctx.setTransform(scale, 0, 0, scale, -translateX*scale, -translateY*scale)
}

function canvasToWorld(){
  return {x: translateX, y: translateY,
    width: ctx.canvas.width/scale, height: ctx.canvas.height/scale
  }
}

for(let i = 0; i < 380; i++){
  for(let j = 0; j < 200; j++){
    rectangles.push(new Rectangle(i*size, j*size, actualColor))
  }
}

resizeCanvas()

