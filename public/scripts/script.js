const socket = io('/canvas')
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

const drawButton = document.getElementById('drawMode')
const addPixel = document.getElementById('draw')
let drawMode = true
const buttons = document.getElementsByClassName('button-color')
let mobileLastPixel

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
let currentColor = "#000000"

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
    if(e.target === modalInfo ){
        closeModal()
    }
})

if (mobileCheck()) {
    mobileLastPixel = new Vector(-1, -1)    //to prevent issues if send before drawHint

    document.getElementsByClassName('row')[0].style.width = "80%"
    for (i=0;i<buttons.length;i++) {
        buttons[i].style.height = "75px"
        buttons[i].style.width = "50px"
        buttons[i].style.visibility = "hidden"
    }

    drawButton.style.visibility = 'visible'
    drawButton.innerText = 'Mode\nexploration'
    drawMode = false

    let hammerButton = new Hammer(drawButton)
    hammerButton.on('tap', drawMobileMode)

    let hammerSend = new Hammer(addPixel)
    hammerSend.on('tap', (e) => {
        sendPixel(mobileLastPixel)
    })

    let hammerInfo = new Hammer(modalInfo)
    hammerInfo.on('tap', closeModal)

    socket.emit("mobile")
    let hammertime =  new Hammer(canvasInterface)
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammertime.get('pinch').set({enable: true})
    hammertime.get('pan').set({threshold: 50})
    hammertime.on('pinch', scroll)
    hammertime.on('pan', moveCanvas)
    hammertime.on('tap', mouseClicked)
    hammertime.on('pan', movePixelHint)

} else {
    canvasInterface.addEventListener('click', mouseClicked)
    canvasInterface.addEventListener('mousedown', mouseDown)
    canvasInterface.addEventListener('wheel', scroll)
    canvasInterface.addEventListener('mousemove', moveCanvas)
}
info.addEventListener('click', openModal)
close.forEach((it)=>{it.addEventListener('click', closeModal)})


function mouseDown(e){
    if(e.button === 1){
        let u = (new Vector(e.x, e.y)).toWorld().toNormalizedGrid()
        if(u.x >= 0 && u.x < width && u.y >= 0 && u.y < height) {
            let data = ctxImage.getImageData(u.x, u.y, 1, 1).data
            let color = intArrayToStringColor(data, false)
            changeColor(color)
            drawHint(e.x, e.y)
        }
    }
}

function mouseClicked(e) {
    if (mobileCheck()) {
        drawHint(e.center.x, e.center.y)
        return
    }

    if (!moved) {
        let click = (new Vector(e.x, e.y)).toWorld().toNormalizedGrid()
        sendPixel(click)
    }

    moved = false
    startDrag = null
}

function changeColor(color) {
    currentColor = color
}

function sendPixel(click) {
    if (click.x >= 0 && click.x < width &&
        click.y >= 0 && click.y < height
    ) {
        socket.emit("change", click.x, click.y, currentColor)
    }
}

function drawMobileMode(e) {
    if (drawMode) {
        drawButton.innerText= 'Mode\nexploration'
        drawButton.style.backgroundColor = "lawngreen"
        addPixel.style.visibility= 'hidden'
        for (i=0;i<buttons.length;i++) {
            buttons[i].style.visibility = "hidden"
        }
        let world = canvasToWorld()
        ctxInterface.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
    } else {
        drawButton.innerText = 'Mode dessin'
        drawButton.style.backgroundColor = "red"
        addPixel.style.visibility= 'visible'
        for (i=0;i<buttons.length;i++) {
            buttons[i].style.visibility = "visible"
        }
    }
    drawMode = !drawMode
}

function scroll(e) {
    let event
    let maxScroll

    if (mobileCheck()) {
        if (e.additionalEvent === "pinchin") {
            event = new eventMove(e.center.x, e.center.y, null, e.scale*2)
        }
        if (e.additionalEvent === "pinchout") {
            event = new eventMove(e.center.x, e.center.y, null, -e.scale)
        }
        maxScroll = 20
    } else {
        event = new eventMove(e.x, e.y, null, e.deltaY)
        maxScroll = 10
    }

    let relativeScale = 1 - event.movementY * 0.01

    let newScale =  scale * relativeScale
    newScale = Math.max(newScale, 0.7)
    newScale = Math.min(newScale, maxScroll)

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
    let highlight = new Vector(x, y).toWorld().toGrid()

    if (mobileCheck()) {
        mobileLastPixel = new Vector(x, y).toWorld().toNormalizedGrid()
    }

    if (!drawMode) return

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
    if (mobileCheck() && drawMode) return

    let event
    if (mobileCheck()) {
        event = new eventMove(e.center.x, e.center.y, e.deltaX/12, e.deltaY/12)
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

function movePixelHint(e) {
    if (!e.isFinal || !drawMode) return
    if (e.additionalEvent === "panup") {
        mobileLastPixel.y -= 1
    } else if (e.additionalEvent === "pandown") {
        mobileLastPixel.y += 1
    } else if (e.additionalEvent === "panright") {
        mobileLastPixel.x += 1
    } else if (e.additionalEvent === "panleft") {
        mobileLastPixel.x -= 1
    }

    position.innerText = "("+(1+mobileLastPixel.x*size)+", "+(1+mobileLastPixel.y*size)+")"

    let world = canvasToWorld()
    ctxInterface.clearRect(world.x - size, world.y - size, world.width + size, world.height + size)
    ctxInterface.globalAlpha = 0.8
    ctxInterface.lineWidth = 1
    ctxInterface.strokeStyle = "#808080"
    ctxInterface.fillStyle = currentColor
    ctxInterface.fillRect(mobileLastPixel.x*size + ctxInterface.lineWidth / 2, mobileLastPixel.y*size + ctxInterface.lineWidth / 2,
        size - ctxInterface.lineWidth, size - ctxInterface.lineWidth
    )
    ctxInterface.strokeRect(mobileLastPixel.x*size, mobileLastPixel.y*size, size, size)
}

function draw() {
    let world = canvasToWorld()
    ctx.clearRect(world.x, world.y, world.width, world.height)
    ctx.drawImage(image,world.x/size, world.y/size, world.width/size, world.height/size,
        world.x, world.y, world.width, world.height)
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
    width = parseInt(widthReceived)
    height = parseInt(heightReceived)

    image.width = width
    image.height = height

    resizeCanvas()
    updateTransform()

    openModal()

    ctxImage.fillStyle = "white"
    let pixelsData = ctxImage.getImageData(0, 0, width, height)
    let pixels = pixelsData.data
    for(let i = 0; i < pixels.length; i+=4){
        pixels[i] = 255
        pixels[i+1] = 255
        pixels[i+2] = 255
        pixels[i+3] = 255
    }

    if(data.array) {
        for (let i in data.value) {
            for (let j in data.value[i]) {
                let color = data.value[i][j]
                if (color != null) {
                    let rgb = hexToRgb(color) || hexToRgb(colourNameToHex(color))
                    pixels[i * 4 * width + 4 * j] = rgb.r
                    pixels[i * 4 * width + 4 * j + 1] = rgb.g
                    pixels[i * 4 * width + 4 * j + 2] = rgb.b
                }
            }
        }
    } else {
        for(let pixel of data.value) {
            if (pixel.color != null) {
                let rgb = hexToRgb(pixel.color) || hexToRgb(colourNameToHex(pixel.color))
                pixels[pixel.y * 4 * width + 4 * pixel.x] = rgb.r
                pixels[pixel.y * 4 * width + 4 * pixel.x + 1] = rgb.g
                pixels[pixel.y * 4 * width + 4 * pixel.x + 2] = rgb.b
            }
        }
    }
    ctxImage.putImageData(pixelsData, 0, 0)

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

            if (timerTime <= 0) {
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

function intArrayToStringColor(data, alpha){
    let color = "#"
    let max = alpha?4:3;
    for(let i =0; i <max; i++){
        let hex = data[i].toString(16)
        if(hex.length === 1) hex = '0'+hex
        color += hex
    }
    return color
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colourNameToHex(colour)
{
    let colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
        "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
        "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
        "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
        "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
        "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
        "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
        "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
        "honeydew":"#f0fff0","hotpink":"#ff69b4",
        "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
        "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
        "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
        "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
        "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
        "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
        "navajowhite":"#ffdead","navy":"#000080",
        "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
        "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
        "rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
        "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
        "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
        "violet":"#ee82ee",
        "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
        "yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (typeof colours[colour.toLowerCase()] != 'undefined')
        return colours[colour.toLowerCase()];

    return false;
}
