import Drawing from "./Drawing.js";
import { mod } from "./utils.js";

class _Animation {
    /**@type {number}*/ static length = null;
    static #frame = 0;
    static set frame(frame) {
        if (this.length === null) {
            throw new Error("_Animation.length must be set before modifying _Animation.frame.");
        }
        this.#frame = mod(frame, this.length);
    }
    static get frame() { return this.#frame }

    /** @type {Drawing[]} */
    #animation;

    /**  @param {string} fillCharacter @param {Drawing[]} animation*/
    constructor(fillCharacter, animation = null) {
        if (_Animation.length === null) {
            throw new Error("_Animation.length must be set before creating an _Animation object.");
        }
        this.#animation = animation !== null ? animation :
            this.#animation = new Array(_Animation.length).fill()
                .map(x => new Drawing(fillCharacter));
    }

    get current() { return this.#animation[_Animation.frame] }
    set current(drawing) { this.#animation[_Animation.frame] = drawing }

    get animation() { return this.#animation }
}

export default _Animation;