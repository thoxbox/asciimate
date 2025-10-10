import Layers from "../Layers.js";
import Frames from "../Frames.js";
import { $, $$ } from "../utils.js";
import HoveredElement from "../HoveredElement.js";

class Timeline extends HTMLElement {
    static move(amountX, amountY) {
        Frames.frame += amountX;
        Layers.layer += amountY;
        this.#renderTimeline();
    }
    static set(x, y) {
        Frames.frame = x;
        Layers.layer = y;
        this.#renderTimeline();
    }
    static #renderTimeline() {
        $$(".timeline-item").forEach(el => el.className = "timeline-item");
        $$(`.timeline-item:nth-child(${Frames.frame + 1})`).forEach(el => {
            el.classList.add("timeline-selected-same-column");
        });
        $$(`.layer:nth-child(${Layers.layer + 1}) > div`).forEach(el => {
            el.classList.add("timeline-selected-same-row");
        });
        $(`.layer:nth-child(${Layers.layer + 1}) > div:nth-child(${Frames.frame + 1})`)
            .className = "timeline-item timeline-selected";
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        this.#initInnerHTML = "";
        this.#initInnerHTML += `<div id="_timeline_numbers">
            ${"<div></div>".repeat(Frames.length)}
        </div>
        <div id="_timeline_layers">`;
        for (let j = 0; j < Layers.length; j++) {
            this.#initInnerHTML += "<div class='layer'>";
            for (let i = 0; i < Frames.length; i++) {
                this.#initInnerHTML += `<div 
                    class="timeline-item"
                    data-x="${i}"
                    data-y="${j}"
                ></div>`;
            }
            this.#initInnerHTML += "</div>";
        }
        this.#initInnerHTML += "</div>"
    }
    static updateDimensions() {
        this.#init();
        $$("timeline-").forEach(x => x.updateDimensions());
        this.#renderTimeline();
    }
    updateDimensions() {
        this.innerHTML = Timeline.#initInnerHTML;
    }
    connectedCallback() {
        if (!Timeline.#elementLoaded) {
            Timeline.#elementLoaded = true;
            Timeline.#init();
        }
        this.innerHTML = Timeline.#initInnerHTML;
        this.addEventListener("click", e => {
            if(!HoveredElement.get().classList.contains("timeline-item")) {
                return;
            }
            const x = HoveredElement.get().getAttribute("data-x")
            const y = HoveredElement.get().getAttribute("data-y")
            Timeline.set(x, y);
        })
        Timeline.#renderTimeline();
    }
}
customElements.define("timeline-", Timeline);

export default Timeline;