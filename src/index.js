"use strict";

import { clamp, inRange, mod, $, $$ } from "./utils.js";
import Mouse from "./Mouse.js";
import HoveredElement from "./HoveredElement.js";

import Drawing from "./Drawing.js";
import DrawingSelection from "./DrawingSelection.js";
import Layers from "./Layers.js";
import Frames from "./Frames.js";
import Brush from "./Brush.js";

import { save, load } from "./filesaving.js";

import {
    OptionButton as OptionComponent,
    Timeline as TimelineComponent,
    Toggle as ToggleComponent,
    DrawingComponent
} from "./web-components/web-components.js";

class Insert {
    static start() {
        this.active = true;
        DrawingComponent.forEach(el => {
            el.setAttribute("data-insert", "");
            el.addEventListener("click", () => {
                Insert.advance();
            }, {once: true});
        });
    }
    /** @type {{x: number, y: number}} */
    static #pixel;
    static advance() {
        DrawingComponent.forEach(el => {
            el.removeAttribute("data-insert");
        });
        this.#pixel = getXYofPixel(HoveredElement.get());
        const insertTextRendered = () => {
            const insertText = $(".insertText");
            insertText.focus();
            insertText.onkeydown = e => {
                if (e.altKey && e.key == "Enter") {
                    insertText.onblur = null;
                    insertText.onkeydown = null;
                    this.render();
                }
            }
            insertText.onblur = () => insertText.focus();
            window.getSelection().setBaseAndExtent(
                insertText, 0, insertText, 1
            );
            observer.disconnect();
        }
        let observer = new MutationObserver(mutations => {
            insertTextRendered();
        });
        observer.observe(HoveredElement.get(), { childList: true });
        HoveredElement.get().innerHTML = `<div
                style="
                    position: absolute; 
                    display: inline-block;"
                class="insert"
            ><div
                contenteditable
                class="insertText"
            >${HoveredElement.get().innerHTML}</div></div>`
            + HoveredElement.get().innerHTML;
    }
    static render() {
        let text = $(".insertText").textContent;
        for (const [y, line] of text.split("\n").entries()) {
            for (const [x, char] of line.split("").entries()) {
                currentDrawing.setPixel(this.#pixel.x + x, this.#pixel.y + y, char);
            }
        }
        render();
        this.start();
    }
    static end() {
        DrawingComponent.forEach(el => {
            el.removeAttribute("data-insert");
        });
        this.active = false;
    }
    static active = false;
    /** @type {boolean} */
    static set active(value) {
        return this.active;
    }
}

const nodes = Object.freeze({
    settings: $("#_settings"),
    settingsWidth: $("#_settings_width"),
    settingsHeight: $("#_settings_height"),
    settingsLayers: $("#_settings_layers"),
    settingsFrames: $("#_settings_frames"),
    settingsForm: $("#_settings_form"),
    drawing: $("#_drawing"),
    play: $("#_play"),
    toolsInsert: $("#_tools_insert"),
    timeline: $("#_timeline"),
    character: $("#_character")
});

nodes.settings.showModal();

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

nodes.settingsForm.addEventListener("submit", e => {
    start();
    e.preventDefault();
}, {once: true});

function start() {
    Frames.length = Number(nodes.settingsFrames.value);
    Layers.length = Number(nodes.settingsLayers.value);
    Drawing.width = Number(nodes.settingsWidth.value);
    Drawing.height = Number(nodes.settingsHeight.value);
    nodes.settings.close();

    layers = new Layers(" ");

    nodes.timeline.innerHTML = "<timeline-></timeline->";
    nodes.drawing.innerHTML = "<drawing-></drawing->";
    currentDrawing.render();

    pixelRect = $(".pixel").getBoundingClientRect();
    Brush.pixelWidth = pixelRect.width;
    Brush.pixelHeight = pixelRect.height;
    Brush.character = "a";
    brush = new Brush(3);

    HoveredElement.update();

    nodes.play.onchange = e => {
        if (nodes.play.checked) {
            if (nodes.toolsInsert.checked) {
                Insert.end();
            }
            nodes.play.setAttribute("data-setintervalid", setInterval(() => {
                TimelineComponent.move(1, 0);
                render();
            }, 100));
        } else {
            if (nodes.toolsInsert.checked) {
                Insert.start();
            }
            clearInterval(nodes.play.getAttribute("data-setintervalid"));
        }
    };

    OptionComponent.onswitch = (index, name) => {
        if (name !== "tools") {
            return;
        }
        if (index === 1) {
            if (!nodes.play.checked) { Insert.start() }
            return;
        }
        Insert.end();
    }

    function drawingHovered() {
        return HoveredElement.get() === null ? false :
            HoveredElement.get().getAttribute("class") === "pixel";
    }

    setInterval(() => {
        if (nodes.play.checked) { return }
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
                    TimelineComponent.move(0, 1);
                    break;
                case "ArrowDown":
                    TimelineComponent.move(0, -1);
                    break;
                case "ArrowRight":
                    TimelineComponent.move(1, 0);
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                    TimelineComponent.move(-1, 0);
                    e.preventDefault();
                    break;
            }
        }
        if (!drawingHovered() && HoveredElement.get() !== nodes.character) { return }
        if (e.key.length > 1) { return }
        Brush.character = e.key;
    }

    Mouse.onMouseWheel = () => {
        if (!drawingHovered() || Insert.active) { return }
        brush.size += Mouse.wheel * 4;
    }
}