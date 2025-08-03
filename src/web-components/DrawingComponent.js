import Drawing from "../Drawing.js";
import { $$ } from "../utils.js";

class DrawingComponent extends HTMLElement {
    /** @type {string[]} */
    static #drawing;
    /** @param {string[][]} drawing */
    static render(drawing) {
        drawing = drawing.flat();
        $$("drawing-").forEach(el => {
            el.querySelectorAll(".pixel").forEach((pixel, i) => {
                if(drawing[i] !== this.#drawing[i]) {
                    pixel.textContent = drawing[i]
                }
            });
        });
        this.#drawing = drawing;
    }
    static forEach(callbackfn) {
        $$("drawing-").forEach(callbackfn);
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        this.#initInnerHTML += "<pre>";
        this.#initInnerHTML += Array(Drawing.height).fill(
            "<span class=\"pixel\"></span>".repeat(Drawing.width)
        ).join("\n");
        this.#initInnerHTML += "</pre>";
        this.#drawing = Array(Drawing.width * Drawing.height).fill("");
    }
    constructor() {
        super();
    }
    connectedCallback() {
        if (!DrawingComponent.#elementLoaded) {
            DrawingComponent.#elementLoaded = true;
            DrawingComponent.#init();
        }
        this.innerHTML = DrawingComponent.#initInnerHTML;
    }
}
customElements.define("drawing-", DrawingComponent);

export default DrawingComponent;