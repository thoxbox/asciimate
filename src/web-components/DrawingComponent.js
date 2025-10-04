import Drawing from "../Drawing.js";
import { $$ } from "../utils.js";

class DrawingComponent extends HTMLElement {
    /** @param {string[][]} drawing */
    static render(drawing) {
        drawing = drawing.flat();
        $$("drawing-").forEach(el => {
            el.querySelectorAll(".pixel").forEach((pixel, i) => {
                if(drawing[i] !== pixel.innerHTML) {
                    pixel.textContent = drawing[i]
                }
            });
        });
    }
    static forEach(callbackfn) {
        $$("drawing-").forEach(callbackfn);
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        this.#initInnerHTML = "";
        this.#initInnerHTML += "<pre>";
        this.#initInnerHTML += Array(Drawing.height).fill(
            "<span class=\"pixel\"></span>".repeat(Drawing.width)
        ).join("\n");
        this.#initInnerHTML += "</pre>";
    }
    static updateDimensions() {
        this.#init();
        $$("drawing-").forEach(x => x.updateDimensions());
    }
    updateDimensions() {
        this.innerHTML = DrawingComponent.#initInnerHTML;
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