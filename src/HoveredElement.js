import Mouse from "./Mouse.js";
class HoveredElement {
    static #hoveredElement;
    static update() {
        this.#hoveredElement = document.elementFromPoint(Mouse.x, Mouse.y);
    }
    static get() {
        return this.#hoveredElement;
    }
}
export default HoveredElement;