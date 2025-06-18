"use strict";

/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
/** @param {number} value @param {number} min @param {number} max */
function inRange(value, min, max) {
    return min <= value && value <= max;
}
/** @param {number} m @param {number} n */
function mod(n, m) {
    return ((n % m) + m) % m;
}

/** @param {string} query @returns {HTMLElement} */
const $ = query => document.querySelector(query);
/** @param {string} query @returns {NodeListOf<HTMLElement>} */
const $$ = query => document.querySelectorAll(query);

const width = 20;
const height = 10;

class Drawing {
    /**  @type {string[][]} */
    #drawing;
    /** @param {string} fillCharacter @param {string[][]} drawing */
    constructor(fillCharacter, drawing = null) {
        this.#drawing = drawing ? drawing : 
            Array(height).fill().map(x => Array(width).fill(fillCharacter));
    }
    get drawing() {return structuredClone(this.#drawing)}
    /** @param {number} x @param {number} y @param {string} character */
    setPixel(x, y, character) {
        if(!(inRange(x, 0, width - 1) && inRange(y, 0, height - 1))) {
            return;
        }
        this.#drawing[y][x] = character;
    }
    /** @param {number} x @param {number} y */
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
    /** @param {Drawing} drawing */
    static clone(drawing) {
        return new Drawing(null, drawing.drawing);
    }
}

class DrawingSelection {
    /** @type {{x: number, y: number}[]} */
    #selection = [];
    /** @param {Drawing} usedDrawing */
    constructor(usedDrawing) {
        /** @type {Drawing} */
        this.drawing = usedDrawing;
    }
    clear() {
        this.#selection = [];
    }
    /** @param {number} x @param {number} y */
    pixel(x, y) {
        if(inRange(x, 0, width - 1) && inRange(y, 0, height - 1)) {
            this.#selection.push({x: x, y: y});
        }
    }
    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
    rect(x1, y1, x2, y2) {
        for(let y = y1; y <= y2; y++) {
            for(let x = x1; x <= x2; x++) {
                this.pixel(x, y);
            }
        }
    }
    /** @returns {string[]} */
    get() {
        return this.#selection.map(i => this.drawing.getPixel(i.x, i.y));
    }
    /** @param {(character: string, x: number, y: number) => void} callbackfn */
    forEach(callbackfn) {
        this.#selection.forEach(i => callbackfn(this.drawing.getPixel(i.x, i.y), i.x, i.y));
    }
    /** @param {(character: string, x: number, y: number) => string} callbackfn */
    setPixels(callbackfn) {
        this.#selection.forEach(i => this.drawing.setPixel(
            i.x, i.y, callbackfn(
                this.drawing.getPixel(i.x, i.y)
                , i.x, i.y
        )));
    }
    /** @param {(character: string, x: number, y: number) => boolean} callbackfn */
    filterPixels(callbackfn) {
        this.drawing.drawing.forEach((line, y) => line.forEach((char, x) => {
            if(callbackfn(char, x, y)) {
                this.pixel(x, y);
            }
        }))
    }
}

class Mouse {
    static #leftClick = false;
    static get leftClick() {return this.#leftClick}
    static #rightClick = false;
    static get rightClick() {return this.#rightClick}
    static #middleClick = false;
    static get middleClick() {return this.#middleClick}
    static #x = 0;
    static get x() {return this.#x}
    static #y = 0;
    static get y() {return this.#y}
    /** @type {-1 | 0 | 1} */
    static #wheel = 0;
    static get wheel() {return this.#wheel}
    static onMouseDown  = () => {};
    static onMouseUp    = () => {};
    static onMouseMove  = () => {};
    static onMouseWheel = () => {};
    /** @param {number} buttons */
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
    static #length = 40;
    static get length() {return this.#length}
    
    static #frame = 0;
    static set frame(frame) {
        const layerDOM = _timeline.children[layers.layer].children;
        layerDOM[this.#frame].classList.remove("timeline-selected");
        this.#frame = mod(frame, this.#length);
        layerDOM[this.#frame].classList.add("timeline-selected");
    }
    static get frame() {return this.#frame}
    
    /** @type {Drawing[]} */
    #animation;
    
    /**  @param {string} fillCharacter @param {Drawing[]} animation*/
    constructor(fillCharacter, animation = null) {
        this.#animation = animation !== null ? animation :
            this.#animation = new Array(_Animation.length).fill()
            .map(x => new Drawing(fillCharacter));
    }
    
    get current() {return this.#animation[_Animation.frame]}
    set current(drawing) {this.#animation[_Animation.frame] = drawing}
    
    get animation() {return this.#animation}
}

class Brush {
    #size;
    /** @type {number}*/ #width;
    /** @type {number}*/ #height;
    
    /** @param {number} brushSize */
    constructor(brushSize) {
        this.#size = clamp(brushSize, 1, pixelWidth * width);
        this.#calculateDimensions();
    }

    set size(value) {
        this.#size = clamp(value, 1, pixelWidth * width);
        this.#calculateDimensions();
    }
    get size() {return this.#size}
    
    /** @param {number} x @param {number} y */
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
    /** @type {string} */
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
    set layer(layer) {
        const layersDOM = _timeline.children;
        layersDOM[this.#layer].children[_Animation.frame].classList.remove("timeline-selected");
        this.#layer = mod(layer, this.#layers.length);
        layersDOM[this.#layer].children[_Animation.frame].classList.add("timeline-selected");
    }
    get layer() {return this.#layer}
    
    /** @type {(_Animation | Drawing)[]} */ #layers;
    get layers() {return this.#layers}
    
    /**  @param {string} fillCharacter @param {(_Animation | Drawing)[]} layers*/
    constructor(fillCharacter, layerAmount, layers = null) {
        if(layers !== null) {
            this.#layers = layers;
        }
        this.#layers = layers !== null ? layers :
            this.#layers = new Array(layerAmount).fill()
            .map(x => new _Animation(fillCharacter));
    }
    
    get current() {return this.#layers[this.#layer].current}
    /** @param {Drawing} drawing */
    set current(drawing) {this.#layers[this.#layer].current = drawing}
}

class Insert {
    static start() {
        this.active = true;
        _drawing.setAttribute("data-insert", "");
        _drawing.setAttribute("onclick", "Insert.advance()");
    }
    /** @type {{x: number, y: number}} */
    static #pixel;
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
    /** @type {boolean} */
    static set active(value) {
        return this.active;
    }
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
/** @param {Element} pixelNode */
function getXYofPixel(pixelNode) {
    const index = [...$$(".pixel")].indexOf(pixelNode);
    if(index == -1) {return}
    return {
        x: index % width,
        y: Math.floor(index / width)
    };
}
function getCurrentLayers() {
    return layers.layers.map(x => x.current);
}
/** @param {Drawing[]} layers */
function render(layers = null) {
    if(layers === null) {
        layers = getCurrentLayers();
    }
    let rendered = new Drawing(" ");
    for(let i of layers) {
        let selection = new DrawingSelection(i);
        selection.filterPixels(x => x !== " ");
        selection.drawing = rendered;
        selection.setPixels((_, x, y) => i.getPixel(x, y));
    }
    rendered.render();
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
    brush.size += Mouse.wheel * 4;
}