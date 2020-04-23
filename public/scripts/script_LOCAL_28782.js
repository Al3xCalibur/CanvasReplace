const socket = io(window.location.origin)

const canvas = document.getElementById('drawing')
const canvasInterface = document.getElementById('interface')

const ctx = canvas.getContext('2d')
const ctxInterface = canvasInterface.getContext('2d')

const size = 5
let width
let height

socket.on("updateAll", (widthReceived, heightReceived) => {
    resizeCanvas()
    updateTransform()

    width = widthReceived
    height = heightReceived
//    rectangles = rectanglesReceived

    for (let i = 0; i < width/size; i++) {
        for (let j = 0; j < height/size; j++) {
            rectangles.push(new Pixel(i * size, j * size, "white"))
        }
    }
    draw()

})

window.mobileCheck = function () {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasInterface.width = window.innerWidth;
    canvasInterface.height = window.innerHeight;

    ctx.imageSmoothingEnabled = false
    ctxInterface.imageSmoothingEnabled = false
    draw()
}


let scale = 2
let translateX = 0
let translateY = 0
let showPercent = 1/8

ctx.lineWidth = 2
let actualColor = "black"

let highlight = null
let startDrag = null

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
}

class Pixel {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
    }
}

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y)
    }

    toWorld() {
        let posX = this.x - canvas.offsetLeft
        let posY = this.y - canvas.offsetTop
        let x = posX / scale + translateX
        let y = posY / scale + translateY
        return new Vector(x, y)
    }

    toGrid() {
        return new Vector(Math.floor(this.x / size) * size, Math.floor(this.y / size) * size)
    }

    magnitude(){
        return Math.sqrt((this.x)**2+(this.y)**2)
    }
}

let rectangles = []

canvasInterface.addEventListener('click', mouseClicked)
window.addEventListener('wheel', scroll)
canvasInterface.addEventListener('mousemove', moveCanvas)


function mouseClicked(e) {
    if (startDrag == null) {
        let click = (new Vector(e.x, e.y)).toWorld().toGrid()

        if (click.x >= 0 && click.x < width &&
            click.y >= 0 && click.y < height
        ) {
            ctx.fillStyle = actualColor
            socket.emit("change", click.x, click.y, actualColor)
            ctx.fillRect(click.x, click.y, size, size)
            rectangles.push(new Pixel(click.x, click.y, actualColor))
        }
    }
    startDrag = null
}

function changeColor(color) {
    actualColor = color
}

function scroll(e) {
    e.preventDefault()
    let relativeScale = 1 - e.deltaY * 0.01
    if (scale * relativeScale >= 1 && scale * relativeScale <= 10) {
        let x = e.x - canvas.offsetLeft, y = e.y - canvas.offsetTop

        let previous = scale
        scale *= relativeScale

        translateX -= x * (1 / scale - 1 / previous)
        translateY -= y * (1 / scale - 1 / previous)
        if (translateX < -width*showPercent) translateX = -width*showPercent
        if (translateX > width*(1-showPercent)) translateX = width*(1-showPercent)
        if (translateY > height*(1-showPercent)) translateY = height*(1-showPercent)
        if (translateY < -height*showPercent) translateY = -height*showPercent
        updateTransform()
        draw()
        drawHint(e)
    }
}

function drawHint(e) {
    highlight = new Vector(e.x, e.y).toWorld().toGrid()
    let world = canvasToWorld()
    ctxInterface.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
    ctxInterface.globalAlpha = 0.8
    ctxInterface.lineWidth = 1
    ctxInterface.strokeStyle = "#808080"
    ctxInterface.fillStyle = actualColor
    ctxInterface.fillRect(highlight.x+ctxInterface.lineWidth/2, highlight.y+ctxInterface.lineWidth/2,
        size-ctxInterface.lineWidth, size-ctxInterface.lineWidth
    )
    ctxInterface.strokeRect(highlight.x, highlight.y, size, size)
}

function moveCanvas(e) {    //legers pb avec startDrag : on dessine pas toujours en cliquant
    drawHint(e)

    if (e.buttons === 0 ) {
        startDrag = null
        return;
    }

    if (startDrag == null)  return startDrag = new Vector(e.x, e.y)
    if ( translateX - e.movementX / scale > -width/scale*showPercent && translateX - e.movementX / scale < width*(1+1/scale*showPercent)-ctx.canvas.width/scale &&
        translateY - e.movementY / scale > -width/scale*showPercent && translateY - e.movementY / scale < height*(1+1/scale*showPercent)-ctx.canvas.height/scale &&
        startDrag.add(new Vector(-e.x, -e.y)).magnitude() > 10
    ){
        translateX -= e.movementX / scale
        translateY -= e.movementY / scale
        updateTransform()
        draw()
    }
}

function draw() {
    let world = canvasToWorld()
    ctx.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
    for (let rectangle of rectangles) {
        if (rectangle.x >= world.x - size && rectangle.x <= world.x + world.width &&
            rectangle.y >= world.y - size && rectangle.y <= world.y + world.height) {
            ctx.fillStyle = rectangle.color
            ctx.fillRect(rectangle.x, rectangle.y, size, size)
        }
    }

}

function updateTransform() {
    ctx.setTransform(scale, 0, 0, scale, -translateX * scale, -translateY * scale)
    ctxInterface.setTransform(scale, 0, 0, scale, -translateX * scale, -translateY * scale)
}

function canvasToWorld() {
    return new Rectangle(
        translateX, translateY,
        ctx.canvas.width / scale, ctx.canvas.height / scale
    )
}


socket.on("update", (data) => {

})

