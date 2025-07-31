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

class Layers {
    initTimeline() {
        let rendered = "";
        for (let j = 0; j < this.#layers.length; j++) {
            rendered += "<div class='layer'>";
            for (let i = 0; i < _Animation.length; i++) {
                rendered += `<div 
                    onclick="layers.layer = ${j}; _Animation.frame = ${i}; renderTimeline()"
                >${i + 1}</div>`;
            }
            rendered += "</div>";
        }
        _timeline.innerHTML = rendered;
    }
    static length = null;

    #layer = 0;

    set layer(layer) {
        this.#layer = mod(layer, Layers.length);
    }
    get layer() { return this.#layer }

    /** @type {(_Animation | Drawing)[]} */ #layers;
    get layers() { return this.#layers }

    /**  @param {string} fillCharacter @param {(_Animation | Drawing)[]} layers*/
    constructor(fillCharacter, layers = null) {
        if (_Animation.length === null) {
            throw new Error("Layers.length must be set before creating a Layers object.");
        }
        if (layers !== null) {
            this.#layers = layers;
        }
        this.#layers = layers !== null ? layers :
            this.#layers = new Array(Layers.length).fill()
                .map(x => new _Animation(fillCharacter));
        this.#layer = Layers.length - 1;
    }

    get current() { return this.#layers[this.#layer].current }
    /** @param {Drawing} drawing */
    set current(drawing) { this.#layers[this.#layer].current = drawing }
}

export { _Animation, Layers }