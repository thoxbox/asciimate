import Drawing from "../Drawing.js";
import { $$ } from "../utils.js";

class DrawingComponent extends HTMLElement {
    /** @param {Drawing} drawing */
    static render(drawing) {
        let rendered = drawing.map((x, i) => {
            return x
                .map(x => `<span class="pixel">${x}</span>`)
                .join("") + "\n";
        }).join("");
        rendered = `<pre>${rendered}</pre>`;
        $$("drawing-").forEach(el => el.innerHTML = rendered);
    }
    static forEach(callbackfn) {
        $$("drawing-").forEach(callbackfn);
    }
}
customElements.define("drawing-", DrawingComponent);

export default DrawingComponent;