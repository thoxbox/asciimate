"use strict";

import { clamp, inRange, mod, $, $$ } from "./utils.js";
import Mouse from "./mouse.js";
import HoveredElement from "./HoveredElement.js";

import Drawing from "./Drawing.js";
import DrawingSelection from "./DrawingSelection.js";
import Layers from "./Layers.js";
import _Animation from "./_Animation.js";

import * as Components from "./web-components/web-components.js";

class Brush {
    #size;
    /** @type {number}*/ #width;
    /** @type {number}*/ #height;

    /** @param {number} brushSize */
    constructor(brushSize) {
        if(Brush.pixelWidth === null) {
            throw new Error("Brush.pixelWidth and Brush.pixelHeight must be set before creating a Brush object.");
        }
        this.#size = clamp(brushSize, 1, Brush.pixelWidth * Drawing.width);
        this.#calculateDimensions();
    }

    set size(value) {
        this.#size = clamp(value, 1, Brush.pixelWidth * Drawing.width);
        this.#calculateDimensions();
    }
    get size() { return this.#size }

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
        this.#width = Math.round(this.#size / Brush.pixelWidth);
        this.#height = Math.round(this.#size / Brush.pixelHeight);
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
    static pixelWidth = null;
    static pixelHeight = null;
}

class Insert {
    static start() {
        this.active = true;
        _drawing.setAttribute("data-insert", "");
        _drawing.addEventListener("click", () => {
            Insert.advance();
        }, {once: true});
    }
    /** @type {{x: number, y: number}} */
    static #pixel;
    static advance() {
        _drawing.removeAttribute("data-insert");
        this.#pixel = getXYofPixel(HoveredElement.get());
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
        observer.observe(HoveredElement.get(), { childList: true });
        HoveredElement.get().innerHTML = `<div
                style="
                    position: absolute; 
                    display: inline-block;"
                id="_insert"
            ><div
                contenteditable
                id="_insertText"
            >${HoveredElement.get().innerHTML}</div></div>`
            + HoveredElement.get().innerHTML;
    }
    static render() {
        let text = _insertText.textContent;
        for (const [y, line] of text.split("\n").entries()) {
            for (const [x, char] of line.split("").entries()) {
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
    get() { return layers.current },
    set(value) { layers.current = value },
});
/** @param {Element} pixelNode */
function getXYofPixel(pixelNode) {
    const index = [...$$(".pixel")].indexOf(pixelNode);
    if (index == -1) { return }
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
    if (layers === null) {
        layers = getCurrentLayers();
    }
    let rendered = new Drawing(" ");
    for (let i of layers) {
        let selection = new DrawingSelection(i);
        selection.filterPixels(x => x !== " ");
        selection.drawing = rendered;
        selection.setPixels((_, x, y) => i.getPixel(x, y));
    }
    rendered.render();
}

let pixelRect;
let brush;

$("#_settings_form").addEventListener("submit", e => {
    start();
    e.preventDefault();
}, {once: true});

function start() {
    _Animation.length = Number(_settings_frames.value);
    Layers.length = Number(_settings_layers.value);
    Drawing.width = Number(_settings_width.value);
    Drawing.height = Number(_settings_height.value);
    layers = new Layers(" ");
    _timeline.innerHTML = '<timeline-></timeline->';
    currentDrawing.render();
    pixelRect = $(".pixel").getBoundingClientRect();
    Brush.pixelWidth = pixelRect.width;
    Brush.pixelHeight = pixelRect.height;
    Brush.character = "a";
    brush = new Brush(3);
    HoveredElement.update();
    _settings.close();

    _play.onchange = e => {
        if (_play.checked) {
            if (_tools_insert.checked) {
                Insert.end();
            }
            _play.setAttribute("data-setintervalid", setInterval(() => {
                Components.Timeline.move(1, 0);
                render();
            }, 100));
        } else {
            if (_tools_insert.checked) {
                Insert.start();
            }
            clearInterval(_play.getAttribute("data-setintervalid"));
        }
    };

    Components.OptionButton.onswitch = (index, name) => {
        if (name !== "tools") {
            return;
        }
        if (index === 1) {
            if (!_play.checked) { Insert.start() }
            return;
        }
        Insert.end();
    }

    function drawingHovered() {
        return HoveredElement.get() === null ? false :
            HoveredElement.get().getAttribute("class") === "pixel";
    }

    setInterval(() => {
        if (_play.checked) { return }
        HoveredElement.update();
        if (Insert.active) { return }
        let pixelPos = getXYofPixel(HoveredElement.get());
        if (!pixelPos) { render(); return }
        let drawingPreview = Drawing.clone(currentDrawing);
        let previewSelection = new DrawingSelection(drawingPreview);
        previewSelection.rect(...brush.dimensions(pixelPos.x, pixelPos.y));
        previewSelection.setPixels(() => Brush.character);
        if (Mouse.leftClick) {
            currentDrawing = Drawing.clone(drawingPreview);
        }
        render(
            getCurrentLayers()
                .map((x, i) => i === Layers.layer ? drawingPreview : x)
        );
    }, 50);

    onkeydown = e => {
        if (Insert.active) { return }
        if (e.key.startsWith("Arrow")) {
            switch (e.key) {
                case "ArrowUp":
                    Components.Timeline.move(0, 1);
                    break;
                case "ArrowDown":
                    Components.Timeline.move(0, -1);
                    break;
                case "ArrowRight":
                    Components.Timeline.move(1, 0);
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                    Components.Timeline.move(-1, 0);
                    e.preventDefault();
                    break;
            }
        }
        if (!drawingHovered() && HoveredElement.get() !== _character) { return }
        if (e.key.length > 1) { return }
        Brush.character = e.key;
    }

    Mouse.onMouseWheel = () => {
        if (!drawingHovered() || Insert.active) { return }
        brush.size += Mouse.wheel * 4;
    }
}