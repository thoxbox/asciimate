import Drawing from "./Drawing.js";
import Frames from "./Frames.js";
import { mod } from "./utils.js";

class Timeline {
    static length = null;

    static #layer = 0;

    static set layer(layer) {
        this.#layer = mod(layer, Timeline.length);
    }
    static get layer() { return this.#layer }

    /** @type {(Frames | Drawing)[]} */ #layers;
    get layers() { return this.#layers }

    /**  @param {string} fillCharacter @param {(Frames | Drawing)[]} layers*/
    constructor(fillCharacter, layers = null) {
        if (Frames.length === null) {
            throw new Error("Layers.length must be set before creating a Layers object.");
        }
        this.#layers =
            layers ??
            new Array(Timeline.length)
                .fill()
                .map((x) => new Frames(fillCharacter));
        Timeline.#layer = Timeline.length - 1;
    }

    get current() { return this.#layers[Timeline.#layer].current }
    /** @param {Drawing} drawing */
    set current(drawing) { this.#layers[Timeline.#layer].current = drawing }
}

export default Timeline;