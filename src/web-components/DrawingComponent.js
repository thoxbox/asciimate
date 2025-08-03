import Drawing from "../Drawing.js";
import { $$ } from "../utils.js";

class DrawingComponent extends HTMLElement {

    static #rendered;
    static render(drawing) {
        this.#rendered = drawing.map((x, i) => {
            return x
                .map(x => `<span class="pixel">${x}</span>`)
                .join("") + "\n";
        }).join("");
        $$("drawing-").forEach(el => {
            el.querySelector("pre").innerHTML = this.#rendered
        });
    }
    static forEach(callbackfn) {
        $$("drawing-").forEach(callbackfn);
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        this.#initInnerHTML = "<pre></pre>";
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