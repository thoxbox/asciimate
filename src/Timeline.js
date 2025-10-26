import Drawing from "./Drawing.js";
import Frames from "./Frames.js";
import { mod } from "./utils.js";

class Timeline {
    static layersLength = null;

    static #layer = 0;

    static set layer(layer) {
        this.#layer = mod(layer, Timeline.layersLength);
    }
    static get layer() { return this.#layer }

    /** @type {(Frames | Drawing)[]} */ #timeline;
    get timeline() { return this.#timeline }

    /**  @param {string} fillCharacter @param {(Frames | Drawing)[]} timeline */
    constructor(fillCharacter, timeline = null) {
        if (Frames.length === null) {
            throw new Error("Timeline.layersLength must be set before creating a Timeline object.");
        }
        this.#timeline =
            timeline ??
            new Array(Timeline.layersLength)
                .fill()
                .map((x) => new Frames(fillCharacter));
        Timeline.#layer = Timeline.layersLength - 1;
    }

    get current() { return this.#timeline[Timeline.#layer].current }
    /** @param {Drawing} drawing */
    set current(drawing) { this.#timeline[Timeline.#layer].current = drawing }
}

export default Timeline;