const socket = io(window.location.origin)
const title = document.querySelector('title')
const titleText = title.innerText
const modalInfo = document.getElementById('modalInfo')
const info = document.getElementById('info')
const close = document.querySelectorAll('.close')

const canvas = document.getElementById('drawing')
const canvasInterface = document.getElementById('interface')
const image = document.getElementById('image')

const people = document.getElementById('people')
const position = document.getElementById('position')

const timer = document.getElementById('timer')
let timerTime = 0
let interval = null

const ctx = canvas.getContext('2d')
const ctxInterface = canvasInterface.getContext('2d')
const ctxImage = image.getContext('2d')

if(!localStorage.getItem('uid')) {
    localStorage.setItem('uid', Math.random().toString(24) + new Date())
}
socket.emit('login', localStorage.getItem('uid'))

const size = 5
let dragMin = 5
let width
let height

window.mobileCheck = function () {
    let check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check
}
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvasInterface.width = window.innerWidth
    canvasInterface.height = window.innerHeight

    ctx.imageSmoothingEnabled = false
    ctxInterface.imageSmoothingEnabled = false
    updateTransform()

    draw()
}


let scale = 2
let translateX = 0
let translateY = 0
let showPercent = 1 / 4

ctx.lineWidth = 2
let currentColor = "black"

let moved = false
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


    toNormalizedGrid() {
        return new Vector(Math.floor(this.x / size), Math.floor(this.y / size))
    }

    magnitude() {
        return Math.sqrt((this.x) ** 2 + (this.y) ** 2)
    }
}

class eventMove {
    constructor(x, y, movementX, movementY) {
        this.x = x
        this.y = y
        this.movementX = movementX
        this.movementY = movementY
    }
}

document.addEventListener('contextmenu', event => event.preventDefault())
window.addEventListener('click', (e) => {
    if(e.target === modalInfo){
        closeModal()
    }
})

let hammertime
if (mobileCheck()) {
    socket.emit("mobile")
    hammertime =  new Hammer(canvasInterface)
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammertime.get('pinch').set({enable: true})
    hammertime.on('pinch', scroll)
    hammertime.on('pan', moveCanvas)
    hammertime.on('tap', mouseClicked)

} else {
    canvasInterface.addEventListener('click', mouseClicked)
    canvasInterface.addEventListener('wheel', scroll)
    canvasInterface.addEventListener('mousemove', moveCanvas)
}
info.addEventListener('click', openModal)
close.forEach((it)=>{it.addEventListener('click', closeModal)})


function mouseClicked(e) {
    if (!moved) {
        let click
        if (mobileCheck()) {
            click = (new Vector(e.center.x, e.center.y)).toWorld().toNormalizedGrid()
        } else {
            click = (new Vector(e.x, e.y)).toWorld().toNormalizedGrid()
        }

        if (click.x >= 0 && click.x < width &&
            click.y >= 0 && click.y < height
        ) {
            socket.emit("change", click.x, click.y, currentColor)
        }
    }
    moved = false
    startDrag = null
}

function changeColor(color) {
    currentColor = color
}



function scroll(e) {
    let event
    if (mobileCheck()) {
        if (e.additionalEvent === "pinchin") {
            event = new eventMove(e.center.x, e.center.y, null, e.scale)
        }
        if (e.additionalEvent === "pinchout") {
            event = new eventMove(e.center.x, e.center.y, null, -e.scale)
        }
    } else {
        event = new eventMove(e.x, e.y, null, e.deltaY)
    }

    let relativeScale = 1 - event.movementY * 0.01
    console.log(event, relativeScale)

    let newScale =  scale * relativeScale
    newScale = Math.max(newScale, 0.7)
    newScale = Math.min(newScale, 10)

    let x = event.x - canvas.offsetLeft, y = event.y - canvas.offsetTop

    let previous = scale
    scale = newScale

    translateX -= x * (1 / scale - 1 / previous)
    translateX = Math.max(translateX, -showPercent*canvas.width/scale)
    translateX = Math.min(translateX, width*size-(1-showPercent)*canvas.width/scale)

    translateY -= y * (1 / scale - 1 / previous)
    translateY = Math.max(translateY, -showPercent*canvas.height/scale)
    translateY = Math.min(translateY, height*size-(1-showPercent)*canvas.height/scale)

    updateTransform()
    draw()
    drawHint(event.x, event.y)
}

function drawHint(x, y) {
    let highlight
    if (mobileCheck()) {
        highlight = new Vector(x, y).toWorld().toGrid()
    } else {
        highlight = new Vector(x, y).toWorld().toGrid()
    }

    position.innerText = "("+(1+highlight.x/size)+", "+(1+highlight.y/size)+")"

    let world = canvasToWorld()
    ctxInterface.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
    ctxInterface.globalAlpha = 0.8
    ctxInterface.lineWidth = 1
    ctxInterface.strokeStyle = "#808080"
    ctxInterface.fillStyle = currentColor
    ctxInterface.fillRect(highlight.x + ctxInterface.lineWidth / 2, highlight.y + ctxInterface.lineWidth / 2,
        size - ctxInterface.lineWidth, size - ctxInterface.lineWidth
    )
    ctxInterface.strokeRect(highlight.x, highlight.y, size, size)
}

function moveCanvas(e) {

    let event
    if (mobileCheck()) {
        event = new eventMove(e.center.x, e.center.y, e.deltaX/20, e.deltaY/20)
    } else {
        if (e.buttons === 0) {
            startDrag = null
            moved = false
            drawHint(e.x, e.y)
            return;
        }
        event = new eventMove(e.x, e.y, e.movementX, e.movementY)
    }
    drawHint(event.x, event.y)

    if (startDrag == null) return startDrag = new Vector(event.x, event.y)

    let newTranslateX = translateX - event.movementX / scale
    let newTranslateY = translateY - event.movementY / scale

    newTranslateX = Math.max(newTranslateX, -showPercent*canvas.width/scale)
    newTranslateX = Math.min(newTranslateX, width*size-(1-showPercent)*canvas.width/scale)

    newTranslateY = Math.max(newTranslateY, -showPercent*canvas.height/scale)
    newTranslateY = Math.min(newTranslateY, height*size-(1-showPercent)*canvas.height/scale)

    if(startDrag.add(new Vector(-event.x, -event.y)).magnitude() > dragMin) {
        moved = true
        translateX = newTranslateX
        translateY = newTranslateY
        updateTransform()
        draw()
    } else {
        moved = false
    }
}

function draw() {
    let world = canvasToWorld()
    ctx.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
    ctx.drawImage(image, 0, 0, size * image.width, size * image.height)
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


socket.on("updateAll", (widthReceived, heightReceived, timer, data) => {
    setTimer(timer)
    width = widthReceived
    height = heightReceived

    image.width = width
    image.height = height

    resizeCanvas()
    updateTransform()

    openModal()

    ctxImage.fillStyle = "white"
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            ctxImage.fillRect(j, i, 1, 1)
        }
    }
    for (pixel of data) {
        ctxImage.fillStyle = pixel.color
        ctxImage.fillRect(pixel.x, pixel.y, 1, 1)
    }

    draw()


})

socket.on("update", (x, y, color) => {
    ctxImage.fillStyle = color
    ctxImage.fillRect(x, y, 1, 1)
    draw()
})

socket.on("updateYou", (x, y, color, timerSec) => {
    ctxImage.fillStyle = color
    ctxImage.fillRect(x, y, 1, 1)
    setTimer(timerSec)
    draw()
})

socket.on("people", (number) => {
    people.innerText = number + " connectés"
})

/**
 * Timer
 * @param seconds
 */
function setTimer(seconds) {
    if(seconds > 0) {
        if (interval != null)
            clearInterval(interval)
        timerTime = seconds
        timer.innerText = timerTime + " seconds"
        title.innerText = timerTime + "s | " + titleText
        timer.style.visibility = 'visible'
        interval = setInterval(() => {
            timerTime--

            if (timerTime === 0) {
                clearInterval(interval)
                timer.style.visibility = 'hidden'
                title.innerText = titleText
            } else {
                timer.innerText = timerTime + " seconds"
                title.innerText = timerTime + "s | " + titleText
            }
        }, 1000)
    }
}

function downloadImg(el) {
    let dl = image.toDataURL("image/png")
    el.href = dl
}

function openModal(){
    modalInfo.style.display = "block"
}

function closeModal() {
    modalInfo.style.display = "none"
}


