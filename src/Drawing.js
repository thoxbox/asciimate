import { inRange } from "./utils.js";
import DrawingComponent from "./web-components/DrawingComponent.js";

class Drawing {
    /** @type {number} */ static width = null;
    /** @type {number} */ static height = null;
    /**  @type {string[][]} */
    #drawing;
    /** @param {string} fillCharacter @param {string[][]} drawing */
    constructor(fillCharacter, drawing = null) {
        if (Drawing.width === null || Drawing.height === null) {
            throw new Error("Drawing.width and Drawing.height must be set before creating a Drawing object.");
        }
        this.#drawing = drawing ? drawing :
            Array(Drawing.height).fill().map(x => Array(Drawing.width).fill(fillCharacter));
    }
    get drawing() { return structuredClone(this.#drawing) }
    /** @param {number} x @param {number} y @param {string} character */
    setPixel(x, y, character) {
        if (!(inRange(x, 0, Drawing.width - 1) && inRange(y, 0, Drawing.height - 1))) {
            return;
        }
        this.#drawing[y][x] = character;
    }
    /** @param {number} x @param {number} y */
    getPixel(x, y) {
        if (!(inRange(x, 0, Drawing.width - 1) && inRange(y, 0, Drawing.height - 1))) {
            return;
        }
        return this.#drawing[y][x];
    }
    render() {
        DrawingComponent.render(this.#drawing);
    }
    /** @param {Drawing} drawing */
    static clone(drawing) {
        return new Drawing(null, drawing.drawing);
    }
}

export default Drawing;