function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function inRange(value, min, max) {
    return min <= value && value <= max;
}

const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

class Drawing {
    #drawing; #width; #height;
    constructor(width, height, fillCharacter = null, drawing = null) {
        this.#width = width;
        this.#height = height;
        this.#drawing = drawing ? drawing : 
            Array(height).fill().map(x => Array(width).fill(fillCharacter));
    }
    get drawing() {return structuredClone(this.#drawing)}
    get width() {return this.#width}
    get height() {return this.#height}
    setPixel(x, y, character) {
        if(!(inRange(x, 0, this.#width - 1) && inRange(y, 0, this.#height - 1))) {
            return;
        }
        this.#drawing[y][x] = character;
    }
    getPixel(x, y) {
        if(!(inRange(x, 0, this.#width - 1) && inRange(y, 0, this.#height - 1))) {
            return;
        }
        return this.#drawing[y][x];
    }
    render() {
        _drawing.innerHTML = this.#drawing.map((x, i) => {
            return x
            .map(x => `<span class="pixel">${x}</span>`)
            .join("") + "\n"
        }).join("");
    }
    static clone(drawing) {
        return new Drawing(drawing.width, drawing.height, null, drawing.drawing);
    }
}
class DrawingSelection {
    #selection = [];
    constructor(usedDrawing) {
        this.drawing = usedDrawing;
    }
    clear() {
        this.#selection = [];
    }
    pixel(x, y) {
        if(inRange(x, 0, this.drawing.width - 1) && inRange(y, 0, this.drawing.height - 1)) {
            this.#selection.push({x: x, y: y});
        }
    }
    rect(x1, y1, x2, y2) {
        for(let y = y1; y <= y2; y++) {
            for(let x = x1; x <= x2; x++) {
                this.pixel(x, y);
            }
        }
    }
    get() {
        return this.#selection.map(i => this.drawing.getPixel(i.x, i.y));
    }
    forEach(callbackfn) {
        this.#selection.forEach(i => callbackfn(this.drawing.getPixel(i.x, i.y), i.x, i.y));
    }
    setPixels(callbackfn) {
        this.#selection.forEach(i => this.drawing.setPixel(
            i.x, i.y, callbackfn(
                this.drawing.getPixel(i.x, i.y)
                , i.x, i.y
        )));
    }
    filterPixels(callbackfn) {
        this.drawing.drawing.forEach((line, y) => line.forEach((char, x) => {
            if(callbackfn(char, x, y)) {
                this.pixel(x, y);
            }
        }))
    }
}

class Mouse {
    static #leftClick = 0;
    static get leftClick() {return this.#leftClick}
    static #rightClick = 0;
    static get rightClick() {return this.#rightClick}
    static #middleClick = 0;
    static get middleClick() {return this.#middleClick}
    static #x = 0;
    static get x() {return this.#x}
    static #y = 0;
    static get y() {return this.#y}
    static #wheel = 0;
    static get wheel() {return this.#wheel}
    static onMouseDown  = () => {};
    static onMouseUp    = () => {};
    static onMouseMove  = () => {};
    static onMouseWheel = () => {};
    static #setButtonsFromMouseEvent(buttons) {
        const buttonsBinary = buttons
            .toString(2)
            .padStart(3, "0")
            .split("")
            .map(x => !!+x);
        [this.#middleClick, this.#rightClick, this.#leftClick] = buttonsBinary;
    }
    static #initialize = (() => {
        document.addEventListener("mousedown", e => {
            this.#setButtonsFromMouseEvent(e.buttons);
            this.onMouseDown();
        }, {passive: true});
        document.addEventListener("mouseup", e => {
            this.#setButtonsFromMouseEvent(e.buttons);
            this.onMouseUp();
        }, {passive: true});
        document.addEventListener("mousemove", e => {
            this.#x = e.clientX;
            this.#y = e.clientY;
            this.onMouseMove();
        }, {passive: true});
        const mouseWheel = (e) => {
            if(e.deltaY != null) {this.#wheel = Math.sign(e.deltaY)}
            this.onMouseWheel();
        }
        document.addEventListener("wheel", mouseWheel, {passive: true});
        document.addEventListener("DOMMouseScroll", mouseWheel, {passive: true});
    })()
}
class _Animation {
    #animation; #frame = 0; #width; #height;
    constructor(width, height, frameAmount, fillCharacter, animation = null) {

        this.#width = width;
        this.#height = height;
        this.#animation = animation ? animation :
            this.#animation = new Array(frameAmount).fill()
            .map(x => new Drawing(
                width, height, fillCharacter
            ));
    }
    addFrame(drawing) {
        this.#animation.push(drawing);
    }
    insertFrame(drawing, index) {
        this.#animation.splice(index, 0, drawing);
    }
    deleteFrame(index) {
        this.#animation.splice(index, 1);
    }
    
    get frameIndex() {return this.#frame}
    set frameIndex(index) {
        this.#frame = index % this.#animation.length;
        this.renderTimeline();
    }

    get frame() {return this.#animation[this.#frame]}
    set frame(layeredDrawing) {this.#animation[this.#frame] = layeredDrawing}

    get animation() {return this.#animation}
    
    get width() {return this.#width}
    get height() {return this.#height}

    renderTimeline() {
        _timeline.innerHTML = "";
        for(let i = 0; i < this.#animation.length; i++) {
            _timeline.innerHTML += `<div ${i === this.#frame ? "class='timeline-selected'" : ""}
                onclick="animation.frameIndex = ${i}">${i + 1}</div>`
        }
    }
}
let animation = new _Animation(20, 10, 40, " ");
animation.renderTimeline();
animation.frame.render();
_play.onchange = () => {
    if(_play.checked) {
        if(_insert.checked) {
            Insert.end();
        }
        _play.setAttribute("data-setintervalid", setInterval(() => {
            animation.frameIndex += 1;
        }, 100));
    } else {
        if(_insert.checked) {
            Insert.start();
        }
        clearInterval(_play.getAttribute("data-setintervalid"));
    }
}

_insert.onchange = () => {
    if(_insert.checked) {
        if(!_play.checked) {Insert.start()}
    } else {
        Insert.end();
    }
}

class Brush {
    static #pixelWidth = $$(".pixel")[0].getBoundingClientRect().width;
    static #pixelHeight = $$(".pixel")[0].getBoundingClientRect().height;
    static get pixelWidth() {return this.#pixelWidth}
    static get pixelHeight() {return this.#pixelHeight}
    #size; #width; #height;

    constructor(brushSize, usedDrawing) {
        this.drawing = usedDrawing;
        this.#size = clamp(brushSize, 1, Brush.#pixelWidth * this.drawing.width);
        this.#calculateDimensions();
    }
    set size(value) {
        this.#size = clamp(value, 1, Brush.#pixelWidth * this.drawing.width);
        this.#calculateDimensions();
    }
    get size() {return this.#size}
    dimensions(x, y) {
        return [
            x - Math.round(this.#width / 2),
            y - Math.round(this.#height / 2),
            x + Math.round(this.#width / 2),
            y + Math.round(this.#height / 2)
        ];
    }
    #calculateDimensions() {
        this.#width = Math.round(this.#size / Brush.#pixelWidth);
        this.#height = Math.round(this.#size / Brush.#pixelHeight);
    }
    static #character;
    static get character() {
        return this.#character;
    }
    static set character(character) {
        this.#character = character.charAt(0);
        _character.innerHTML = this.#character;
    }
}
Brush.character = "a";
let brush = new Brush(3, animation);
let hoveredElement = document.elementFromPoint(Mouse.x, Mouse.y);
function drawingHovered() {
    return hoveredElement.getAttribute("class") == "pixel";
}
function getXYofPixel(pixelNode) {
    const index = pixelNode||{}.parentElement == _drawing ?
        [...$$(".pixel")].indexOf(pixelNode) : -1;
    if(index == -1) {return}
    return {
        x: index % animation.frame.width,
        y: Math.floor(index / animation.frame.width)
    };
}
class Insert {
    static start() {
        this.#active = true;
        _drawing.setAttribute("data-insert", "");
        _drawing.setAttribute("onclick", "Insert.advance()");
    }
    static #pixel;
    static advance() {
        _drawing.removeAttribute("data-insert");
        _drawing.removeAttribute("onclick");
        this.#pixel = getXYofPixel(hoveredElement);
        let maxWidth = animation.width - this.#pixel.x;
        let maxHeight = animation.height - this.#pixel.y;
        hoveredElement.innerHTML = `<div
                style="
                    position: absolute; 
                    display: inline-block;"
                id="_insert"
            ><div
                contenteditable
                id="_insertText"
                onblur="this.focus()"
            >${hoveredElement.innerHTML}</div></div>`
             + hoveredElement.innerHTML;
        _insertText.focus();
        _insertText.onkeydown = e => {
            if (e.altKey && e.key == "Enter") {
                this.render();
            }
        }
        window.getSelection().setBaseAndExtent(_insertText, 0, _insertText, 1);
    }
    static render() {
        let text = _insertText.textContent;
        let origin = getXYofPixel(this.#pixel);
        for(const [y, line] of text.split("\n").entries()) {
            for(const [x, char] of line.split("").entries()) {
                animation.frame.setPixel(this.#pixel.x + x, this.#pixel.y + y, char);
            }
        }
        // hoveredElement = document.body;
        animation.frame.render();
        this.start();
    }
    static end() {
        _drawing.removeAttribute("data-insert");
        _drawing.removeAttribute("onclick");
        animation.frame.render();
        this.#active = false;
    }
    static #active;
    static get active() {return this.#active}
}

setInterval(() => {
    if(_play.checked) {
        return;
    }
    hoveredElement = document.elementFromPoint(Mouse.x, Mouse.y);
    if(Insert.active) {return}
    let pixelPos = getXYofPixel(hoveredElement);
    if(!pixelPos) {animation.frame.render(); return}
    let drawingPreview = Drawing.clone(animation.frame);
    let previewSelection = new DrawingSelection(drawingPreview);
    previewSelection.rect(...brush.dimensions(pixelPos.x, pixelPos.y));
    previewSelection.setPixels(() => Brush.character);
    if(Mouse.leftClick) {
        animation.frame = Drawing.clone(drawingPreview);
    }
    drawingPreview.render();
}, 50);

onkeydown = e => {
    if(!drawingHovered() && hoveredElement != _character) {return}
    if(Insert.active) {return}
    if(e.key.length > 1) {return}
    Brush.character = e.key;
}

Mouse.onMouseWheel = () => {
    if(!drawingHovered() || Insert.active) {return}
    brush.size = brush.size + Mouse.wheel * 4;
}