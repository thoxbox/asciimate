"use strict";

import { clamp, inRange, mod, $, $$, asyncPipe } from "./utils.js";
import Mouse from "./Mouse.js";
import FileSaver from "./FileSaver.js";
import { save, load } from "./filesaving.js";
import publisher from "./publisher.js";
import HoveredElement from "./HoveredElement.js";

import Drawing from "./Drawing.js";
import DrawingSelection from "./DrawingSelection.js";
import Timeline from "./Timeline.js";
import Brush from "./Brush.js";

import {
    OptionButton as OptionComponent,
    TimelineComponent,
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
    character: $("#_character"),
    save: $("#_save"),
    load: $("#_load"),
    publisher_name: $("#_publisher_name")
});

nodes.settings.showModal();

/** @type {Timeline} */
let timeline;
Object.defineProperty(window, "currentDrawing", {
    get() { return timeline.current },
    set(value) { timeline.current = value },
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
    return timeline.timeline.map(x => x[Timeline.frame]);
}
/** @param {Drawing[]} timeline */
function render(timeline = null) {
    if (timeline === null) {
        timeline = getCurrentLayers();
    }
    let rendered = new Drawing(" ");
    for (let i of timeline) {
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
nodes.publisher_name.innerHTML = publisher.name;
document.title = publisher.name;

function start() {
    Timeline.framesLength = Number(nodes.settingsFrames.value);
    Timeline.layersLength = Number(nodes.settingsLayers.value);
    Drawing.width = Number(nodes.settingsWidth.value);
    Drawing.height = Number(nodes.settingsHeight.value);
    nodes.settings.close();

    timeline = new Timeline(" ");

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
                Timeline.move(1, 0);
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
    const projectFile = FileSaver.createFileOptions(
        `project${publisher.fileExtension}`,
        publisher.mimeType,
        publisher.fileExtension,
        `${publisher.name} File`,
    );
    nodes.save.addEventListener("click", () => {
        FileSaver.save(save(timeline), projectFile);
    });
    nodes.load.addEventListener("click", async () => {
        asyncPipe(
            x => FileSaver.load(x),
            x => load(x),
            x => {
                timeline = x.timeline;
                Drawing.width = x.projectData.width;
                Drawing.height = x.projectData.height;
                Timeline.layersLength = x.projectData.layers;
                Timeline.framesLength = x.projectData.frames;
                TimelineComponent.updateDimensions();
                DrawingComponent.updateDimensions();
            },
        )(projectFile);
    });
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
                .map((x, i) => i === Timeline.layer ? drawingPreview : x)
        );
    }, 50);

    onkeydown = e => {
        if (Insert.active) { return }
        if (e.key.startsWith("Arrow")) {
            switch (e.key) {
                case "ArrowUp":
                    Timeline.move(0, 1);
                    break;
                case "ArrowDown":
                    Timeline.move(0, -1);
                    break;
                case "ArrowRight":
                    Timeline.move(1, 0);
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                    Timeline.move(-1, 0);
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