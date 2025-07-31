import Drawing from "./Drawing.js";
import { inRange } from "./utils.js";

class DrawingSelection {
    /** @type {{x: number, y: number}[]} */
    #selection = [];
    /** @param {Drawing} usedDrawing */
    constructor(usedDrawing) {
        /** @type {Drawing} */
        this.drawing = usedDrawing;
    }
    clear() {
        this.#selection = [];
    }
    /** @param {number} x @param {number} y */
    pixel(x, y) {
        if (inRange(x, 0, Drawing.width - 1) && inRange(y, 0, Drawing.height - 1)) {
            this.#selection.push({ x: x, y: y });
        }
    }
    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 */
    rect(x1, y1, x2, y2) {
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                this.pixel(x, y);
            }
        }
    }
    /** @returns {string[]} */
    get() {
        return this.#selection.map(i => this.drawing.getPixel(i.x, i.y));
    }
    /** @param {(character: string, x: number, y: number) => void} callbackfn */
    forEach(callbackfn) {
        this.#selection.forEach(i => callbackfn(this.drawing.getPixel(i.x, i.y), i.x, i.y));
    }
    /** @param {(character: string, x: number, y: number) => string} callbackfn */
    setPixels(callbackfn) {
        this.#selection.forEach(i => this.drawing.setPixel(
            i.x, i.y, callbackfn(
                this.drawing.getPixel(i.x, i.y)
                , i.x, i.y
            )
        ));
    }
    /** @param {(character: string, x: number, y: number) => boolean} callbackfn */
    filterPixels(callbackfn) {
        this.drawing.drawing.forEach((line, y) => line.forEach((char, x) => {
            if (callbackfn(char, x, y)) {
                this.pixel(x, y);
            }
        }))
    }
}

export default DrawingSelection;