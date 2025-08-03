import Drawing from "../Drawing.js";
import { $$ } from "../utils.js";

class DrawingComponent extends HTMLElement {
    /** @param {Drawing} drawing */
    static #rendered;
    static render(drawing) {
        this.#rendered = drawing.map((x, i) => {
            return x
                .map(x => `<span class="pixel">${x}</span>`)
                .join("") + "\n";
        }).join("");
        this.#rendered = `<pre>${this.#rendered}</pre>`;
        $$("drawing-").forEach(el => el.innerHTML = rendered);
    }
    static forEach(callbackfn) {
        $$("drawing-").forEach(callbackfn);
    }
}
customElements.define("drawing-", DrawingComponent);

export default DrawingComponent;