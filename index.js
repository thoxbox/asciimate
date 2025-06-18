"use strict";

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function inRange(value, min, max) {
    return min <= value && value <= max;
}
function mod(n, m) {
    return ((n % m) + m) % m;
}

const $ = query => document.querySelector(query);
const $$ = query => document.querySelectorAll(query);

const width = 20;
const height = 10;

class Drawing {
    #drawing;
    constructor(fillCharacter = null, drawing = null) {
        this.#drawing = drawing ? drawing : 
            Array(height).fill().map(x => Array(width).fill(fillCharacter));
    }
    get drawing() {return structuredClone(this.#drawing)}
    setPixel(x, y, character) {
        if(!(inRange(x, 0, width - 1) && inRange(y, 0, height - 1))) {
            return;
        }
        this.#drawing[y][x] = character;
    }
    getPixel(x, y) {
        if(!(inRange(x, 0, width - 1) && inRange(y, 0, height - 1))) {
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
        return new Drawing(null, drawing.drawing);
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
        if(inRange(x, 0, width - 1) && inRange(y, 0, height - 1)) {
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
    static renderTimeline() {
        _timeline.innerHTML = "";
        for(let i = 0; i < this.length; i++) {
            _timeline.innerHTML += `<div ${i === this.#frame ? "class='timeline-selected'" : ""}
                onclick="_Animation.frame = ${i}">${i + 1}</div>`
        }
    }
    static #length = 40;
    static get length() {return this.#length}
    static #frame = 0;
    static set frame(int) {
        const layerDOM = _timeline.children[layers.layer].children;
        layerDOM[this.#frame].classList.remove("timeline-selected");
        this.#frame = mod(int, this.#length);
        layerDOM[this.#frame].classList.add("timeline-selected");
    }
    static get frame() {return this.#frame}
    #animation;
    /**  @param {string} fillCharacter @param {Drawing[] | null} animation*/
    constructor(fillCharacter, animation = null) {
        this.#animation = animation !== null ? animation :
            this.#animation = new Array(_Animation.length).fill()
            .map(x => new Drawing(fillCharacter));
    }
    
    get current() {return this.#animation[_Animation.frame]}
    set current(layeredDrawing) {this.#animation[_Animation.frame] = layeredDrawing}
    
    /** @returns {Drawing[]}*/
    get animation() {return this.#animation}
}

class Brush {
    #size; #width; #height;

    constructor(brushSize) {
        this.#size = clamp(brushSize, 1, pixelWidth * width);
        this.#calculateDimensions();
    }
    set size(value) {
        this.#size = clamp(value, 1, pixelWidth * width);
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
        this.#width = Math.round(this.#size / pixelWidth);
        this.#height = Math.round(this.#size / pixelHeight);
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

class Layers {
    renderTimeline() {
        let rendered = "";
        for(let j = 0; j < this.#layers.length; j++) {
            rendered += "<div class='layer'>";
            for(let i = 0; i < _Animation.length; i++) {
                rendered += `<div ${i === _Animation.frame && j === this.#layer ? "class='timeline-selected'" : ""}
                    onclick="layers.layer = ${j}; _Animation.frame = ${i}";>${i + 1}</div>`;
            }
            rendered += "</div>";
        }
        _timeline.innerHTML = rendered;
    }
    #layer = 0;
    set layer(int) {
        const layersDOM = _timeline.children;
        layersDOM[this.#layer].children[_Animation.frame].classList.remove("timeline-selected");
        this.#layer = mod(int, this.#layers.length);
        layersDOM[this.#layer].children[_Animation.frame].classList.add("timeline-selected");
    }
    get layer() {return this.#layer}
    #layers;
    /**  @param {string} fillCharacter @param {Array | null} layers*/
    constructor(fillCharacter, layerAmount, layers = null) {
        if(layers !== null) {
            this.#layers = layers;
        }
        this.#layers = layers !== null ? layers :
            this.#layers = new Array(layerAmount).fill()
            .map(x => new _Animation(fillCharacter));
    }
    
    get current() {
        return this.#layers[this.#layer].current}
    set current(drawing) {this.#layers[this.#layer].current = drawing}
    
    /** @returns {Array}*/
    get layers() {return this.#layers}
}

let layers = new Layers(" ", 3);
Object.defineProperty(window, "currentDrawing", {
    get () {return layers.current},
    set (value) {layers.current = value}
});
layers.renderTimeline();
currentDrawing.render();
let pixelRect = $(".pixel").getBoundingClientRect();
let pixelWidth = pixelRect.width;
let pixelHeight = pixelRect.height;
Brush.character = "a";
let brush = new Brush(3);
let hoveredElement = document.elementFromPoint(Mouse.x, Mouse.y);

_play.onchange = () => {
    if(_play.checked) {
        if(_insert.checked) {
            Insert.end();
        }
        _play.setAttribute("data-setintervalid", setInterval(() => {
            _Animation.frame += 1;
            render();
        }, 100));
    } else {
        if(_insert.checked) {
            Insert.start();
        }
        clearInterval(_play.getAttribute("data-setintervalid"));
    }
};

_insert.onchange = () => {
    if(_insert.checked) {
        if(!_play.checked) {Insert.start()}
    } else {
        Insert.end();
    }
}
function drawingHovered() {
    return hoveredElement.getAttribute("class") == "pixel";
}
function getXYofPixel(pixelNode) {
    const index = [...$$(".pixel")].indexOf(pixelNode);
    if(index == -1) {return}
    return {
        x: index % width,
        y: Math.floor(index / width)
    };
}
function getCurrentLayers() {
    return layers.layers.map(x => x.current)
}
function render(_layers = null) {
    if(_layers === null) {
        _layers = getCurrentLayers();
    }
    let rendered = new Drawing(" ")
    for(let i of _layers) {
        let selection = new DrawingSelection(i);
        selection.filterPixels(x => x !== " ");
        selection.drawing = rendered;
        selection.setPixels((_, x, y) => i.getPixel(x, y));
    }
    rendered.render()
}
class Insert {
    static start() {
        this.active = true;
        _drawing.setAttribute("data-insert", "");
        _drawing.setAttribute("onclick", "Insert.advance()");
    }
    static #pixel;
    static #text;
    static advance() {
        _drawing.removeAttribute("data-insert");
        _drawing.removeAttribute("onclick");
        this.#pixel = getXYofPixel(hoveredElement);
        hoveredElement.innerHTML = `<div
                style="
                    position: absolute; 
                    display: inline-block;"
                id="_insert"
            ><div
                contenteditable
                id="_insertText"
            >${hoveredElement.innerHTML}</div></div>`
             + hoveredElement.innerHTML;
        _insertText.focus();
        _insertText.onkeydown = e => {
            if (e.altKey && e.key == "Enter") {
                this.render();
            }
        }
        _insertText.onblur = () => _insertText.focus();
        window.getSelection().setBaseAndExtent(_insertText, 0, _insertText, 1);
    }
    static render() {
        let text = _insertText.textContent;
        for(const [y, line] of text.split("\n").entries()) {
            for(const [x, char] of line.split("").entries()) {
                currentDrawing.setPixel(this.#pixel.x + x, this.#pixel.y + y, char);
            }
        }
        currentDrawing.render();
        this.start();
    }
    static end() {
        _drawing.removeAttribute("data-insert");
        _drawing.removeAttribute("onclick");
        currentDrawing.render();
        this.active = false;
    }
    static active = false;
    static set active(value) {
        return this.active
    }
}

setInterval(() => {
    if(_play.checked) {return}
    hoveredElement = document.elementFromPoint(Mouse.x, Mouse.y);
    if(Insert.active) {return}
    let pixelPos = getXYofPixel(hoveredElement);
    if(!pixelPos) {render(); return}
    let drawingPreview = Drawing.clone(currentDrawing);
    let previewSelection = new DrawingSelection(drawingPreview);
    previewSelection.rect(...brush.dimensions(pixelPos.x, pixelPos.y));
    previewSelection.setPixels(() => Brush.character);
    if(Mouse.leftClick) {
        currentDrawing = Drawing.clone(drawingPreview);
    }
    render(
        getCurrentLayers()
            .map((x, i) => i === layers.layer ? drawingPreview : x)
    );
}, 50);

onkeydown = e => {
    if(Insert.active) {return}
    if(e.key.startsWith("Arrow")) {
        switch(e.key) {
            case "ArrowUp":
                layers.layer -= 1;
                break;
            case "ArrowDown":
                layers.layer += 1;
                break;
            case "ArrowRight":
                _Animation.frame += 1;
                break;
            case "ArrowLeft":
                _Animation.frame -= 1;
                break;
        }
    }
    if(!drawingHovered() && hoveredElement != _character) {return}
    if(e.key.length > 1) {return}
    Brush.character = e.key;
}

Mouse.onMouseWheel = () => {
    if(!drawingHovered() || Insert.active) {return}
    brush.size = brush.size + Mouse.wheel * 4;
}