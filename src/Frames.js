import Drawing from "./Drawing.js";
import { mod } from "./utils.js";

class Frames {
    /**@type {number}*/ static length = null;
    static #frame = 0;
    static set frame(frame) {
        if (this.length === null) {
            throw new Error("Frames.length must be set before modifying Frames.frame.");
        }
        this.#frame = mod(frame, this.length);
    }
    static get frame() { return this.#frame }

    /** @type {Drawing[]} */
    #animation;

    /**  @param {string} fillCharacter @param {Drawing[]} animation*/
    constructor(fillCharacter, animation = null) {
        if (Frames.length === null) {
            throw new Error("Frames.length must be set before creating an Frames object.");
        }
        this.#animation =
            animation ??
            new Array(Frames.length)
                .fill()
                .map((x) => new Drawing(fillCharacter));
    }

    get current() { return this.#animation[Frames.frame] }
    set current(drawing) { this.#animation[Frames.frame] = drawing }

    get animation() { return this.#animation }
}

export default Frames;