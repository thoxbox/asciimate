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

class Drawing {
    /** @type {number} */ static width = null;
    /** @type {number} */ static height = null;
    /**  @type {string[][]} */
    #drawing;
    /** @param {string} fillCharacter @param {string[][]} drawing */
    constructor(fillCharacter, drawing = null) {
        if(Drawing.width === null || Drawing.height === null) {
            throw new Error("Drawing.width and Drawing.height must be set before creating a Drawing object.");
        }
        this.#drawing = drawing ? drawing : 
            Array(Drawing.height).fill().map(x => Array(Drawing.width).fill(fillCharacter));
    }
    get drawing() {return structuredClone(this.#drawing)}
    /** @param {number} x @param {number} y @param {string} character */
    setPixel(x, y, character) {
        if(!(inRange(x, 0, Drawing.width - 1) && inRange(y, 0, Drawing.height - 1))) {
            return;
        }
        this.#drawing[y][x] = character;
    }
    /** @param {number} x @param {number} y */
    getPixel(x, y) {
        if(!(inRange(x, 0, Drawing.width - 1) && inRange(y, 0, Drawing.height - 1))) {
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
        if(inRange(x, 0, Drawing.width - 1) && inRange(y, 0, Drawing.height - 1)) {
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
    /**@type {number}*/ static length = null;
    static #frame = 0;
    static set frame(frame) {
        if(this.length === null) {
            throw new Error("_Animation.length must be set before modifying _Animation.frame.");
        }
        this.#frame = mod(frame, this.length);
    }
    static get frame() {return this.#frame}
    
    /** @type {Drawing[]} */
    #animation;
    
    /**  @param {string} fillCharacter @param {Drawing[]} animation*/
    constructor(fillCharacter, animation = null) {
        if(_Animation.length === null) {
            throw new Error("_Animation.length must be set before creating an _Animation object.");
        }
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
        this.#size = clamp(brushSize, 1, pixelWidth * Drawing.width);
        this.#calculateDimensions();
    }

    set size(value) {
        this.#size = clamp(value, 1, pixelWidth * Drawing.width);
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
    initTimeline() {
        let rendered = "";
        for(let j = 0; j < this.#layers.length; j++) {
            rendered += "<div class='layer'>";
            for(let i = 0; i < _Animation.length; i++) {
                rendered += `<div 
                    onclick="layers.layer = ${j}; _Animation.frame = ${i}; renderTimeline()"
                >${i + 1}</div>`;
            }
            rendered += "</div>";
        }
        _timeline.innerHTML = rendered;
    }
    #layer = 0;

    set layer(layer) {
        this.#layer = mod(layer, layers.layers.length);
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
        const _insertTextRendered = () => {
            _insertText.focus();
            _insertText.onkeydown = e => {
                if (e.altKey && e.key == "Enter") {
                    _insertText.onblur = null;
                    _insertText.onkeydown = null;
                    this.render();
                }
            }
            _insertText.onblur = () => _insertText.focus();
            window.getSelection().setBaseAndExtent(_insertText, 0, _insertText, 1);
            observer.disconnect();
        }
        let observer = new MutationObserver(mutations => {
            _insertTextRendered();
            console.log("something happened");
        });
        observer.observe(hoveredElement, { childList: true });
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
    }
    static render() {
        let text = _insertText.textContent;
        for(const [y, line] of text.split("\n").entries()) {
            for(const [x, char] of line.split("").entries()) {
                currentDrawing.setPixel(this.#pixel.x + x, this.#pixel.y + y, char);
            }
        }
        render();
        this.start();
    }
    static end() {
        _drawing.removeAttribute("data-insert");
        _drawing.removeAttribute("onclick");
        this.active = false;
    }
    static active = false;
    /** @type {boolean} */
    static set active(value) {
        return this.active;
    }
}

_settings.showModal();
/** @type {Layers} */
let layers;
Object.defineProperty(window, "currentDrawing", {
    get () {return layers.current},
    set (value) {layers.current = value},
});
/** @param {Element} pixelNode */
function getXYofPixel(pixelNode) {
    const index = [...$$(".pixel")].indexOf(pixelNode);
    if(index == -1) {return}
    return {
        x: index % Drawing.width,
        y: Math.floor(index / Drawing.width)
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
class Timeline extends HTMLElement {
    static move(amountX, amountY) {
        _Animation.frame += amountX;
        layers.layer += amountY;
        this.#renderTimeline();
    }
    static set(x, y) {
        _Animation.frame = x;
        layers.layer = y;
        this.#renderTimeline();
    }
    static #renderTimeline() {
        $$(".layer > div").forEach(el => el.className = "");
        $$(`.layer > div:nth-child(${_Animation.frame + 1})`).forEach(el => {
            el.className = "timeline-selected-same-column";
        });
        $$(`.layer:nth-child(${layers.layer + 1}) > div`).forEach(el => {
            el.className = "timeline-selected-same-row"
        })
        $(`.layer:nth-child(${layers.layer + 1}) > div:nth-child(${_Animation.frame + 1})`)
            .className = "timeline-selected";
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        for(let j = 0; j < layers.layers.length; j++) {
            this.#initInnerHTML += "<div class='layer'>";
            for(let i = 0; i < _Animation.length; i++) {
                this.#initInnerHTML += `<div 
                    onclick="Timeline.set(${i}, ${j})"
                >${i + 1}</div>`;
            }
            this.#initInnerHTML += "</div>";
        }
    }
    connectedCallback() {
        if(!Timeline.#elementLoaded) {
            Timeline.#elementLoaded = true;
            Timeline.#init();
        }
        this.innerHTML = Timeline.#initInnerHTML;
        Timeline.#renderTimeline();
    }
}
customElements.define("timeline-", Timeline);

let pixelRect;
let pixelWidth;
let pixelHeight;
let brush;
let hoveredElement;

function start() {
    _Animation.length = Number(_settings_frames.value);
    Drawing.width = Number(_settings_width.value);
    Drawing.height = Number(_settings_height.value);
    layers = new Layers(" ", Number(_settings_layers.value));
    _timeline.innerHTML = '<timeline-></timeline->';
    currentDrawing.render();
    pixelRect = $(".pixel").getBoundingClientRect();
    pixelWidth = pixelRect.width;
    pixelHeight = pixelRect.height;
    Brush.character = "a";
    brush = new Brush(3);
    hoveredElement = document.elementFromPoint(Mouse.x, Mouse.y);
    _settings.close();
    
    _play.onchange = () => {
        if(_play.checked) {
            if(_insert.checked) {
                Insert.end();
            }
            _play.setAttribute("data-setintervalid", setInterval(() => {
                Timeline.move(1, 0);
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
        return hoveredElement.getAttribute("class") === "pixel";
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
                    Timeline.move(0, -1);
                    break;
                case "ArrowDown":
                    Timeline.move(0, 1);
                    break;
                case "ArrowRight":
                    Timeline.move(1, 0);
                    break;
                case "ArrowLeft":
                    Timeline.move(-1, 0);
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
}