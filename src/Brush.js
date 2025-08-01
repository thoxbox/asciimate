import Drawing from "./Drawing.js";
import { clamp } from "./utils.js";

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

export default Brush;