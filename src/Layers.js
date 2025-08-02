import Drawing from "./Drawing.js";
import Frames from "./Frames.js";
import { mod } from "./utils.js";

class Layers {
    static length = null;

    static #layer = 0;

    static set layer(layer) {
        this.#layer = mod(layer, Layers.length);
    }
    static get layer() { return this.#layer }

    /** @type {(Frames | Drawing)[]} */ #layers;
    get layers() { return this.#layers }

    /**  @param {string} fillCharacter @param {(Frames | Drawing)[]} layers*/
    constructor(fillCharacter, layers = null) {
        if (Frames.length === null) {
            throw new Error("Layers.length must be set before creating a Layers object.");
        }
        if (layers !== null) {
            this.#layers = layers;
        }
        this.#layers = layers !== null ? layers :
            this.#layers = new Array(Layers.length).fill()
                .map(x => new Frames(fillCharacter));
        Layers.#layer = Layers.length - 1;
    }

    get current() { return this.#layers[Layers.#layer].current }
    /** @param {Drawing} drawing */
    set current(drawing) { this.#layers[Layers.#layer].current = drawing }
}

export default Layers;