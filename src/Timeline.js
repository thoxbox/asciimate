import Drawing from "./Drawing.js";
import DrawingComponent from "./web-components/DrawingComponent.js";
import { mod } from "./utils.js";
import TimelineComponent from "./web-components/TimelineComponent.js";

class Timeline {
    /** @type {number | null} */ static layersLength = null;
    /** @type {number} */ static #layer = 0;

    /** @param {number} layer */
    static set layer(layer) {
        if (this.layersLength === null) {
            throw new Error("Timeline.layersLength must be set before modifying Timeline.layer.");
        }
        this.#layer = mod(layer, this.layersLength);
    }
    static get layer() { return this.#layer }

    /** @type {number | null} */ static framesLength = null;
    /** @type {number} */ static #frame = 0;
    /** @param {number} frame */
    static set frame(frame) {
        if (this.framesLength === null) {
            throw new Error("Timeline.framesLength must be set before modifying Timeline.frame.");
        }
        this.#frame = mod(frame, this.framesLength);
    }
    static get frame() { return this.#frame }
    static move(frames, layers) {
        Timeline.frame += frames;
        Timeline.layer += layers;
        TimelineComponent.render();
    }
    static set(frame, layer) {
        Timeline.frame = frame;
        Timeline.layer = layer;
        TimelineComponent.render();
    }

    /** @type {(Drawing)[][]} */ #timeline;
    get timeline() { return this.#timeline }

    /** @param {string} fillCharacter @param {(Drawing)[][]} timeline */
    constructor(fillCharacter, timeline = null) {
        if (Timeline.layersLength === null) {
            throw new Error("Timeline.layersLength must be set before creating a Timeline object.");
        }
        if (Timeline.framesLength === null) {
            throw new Error("Timeline.framesLength must be set before creating a Timeline object.");
        }
        this.#timeline =
            timeline ??
            new Array(Timeline.layersLength)
                .fill()
                .map(() => new Array(Timeline.framesLength)
                    .fill()
                    .map(() => new Drawing(fillCharacter))
                );            
        Timeline.#layer = Timeline.layersLength - 1;
        Timeline.#frame = 0;
    }

    get current() { return this.#timeline[Timeline.#layer][Timeline.#frame] }
    /** @param {Drawing} drawing */
    set current(drawing) { this.#timeline[Timeline.#layer][Timeline.#frame] = drawing }
}

export default Timeline;