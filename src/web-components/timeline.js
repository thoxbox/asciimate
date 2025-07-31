import Layers from "../Layers.js";
import _Animation from "../_Animation.js";
import { $, $$ } from "../utils.js";
import HoveredElement from "../HoveredElement.js";

class Timeline extends HTMLElement {
    static move(amountX, amountY) {
        _Animation.frame += amountX;
        Layers.layer += amountY;
        this.#renderTimeline();
    }
    static set(x, y) {
        _Animation.frame = x;
        Layers.layer = y;
        this.#renderTimeline();
    }
    static #renderTimeline() {
        $$(".timeline-item").forEach(el => el.className = "timeline-item");
        $$(`.timeline-item:nth-child(${_Animation.frame + 1})`).forEach(el => {
            el.classList.add("timeline-selected-same-column");
        });
        $$(`.layer:nth-child(${Layers.layer + 1}) > div`).forEach(el => {
            el.classList.add("timeline-selected-same-row");
        });
        $(`.layer:nth-child(${Layers.layer + 1}) > div:nth-child(${_Animation.frame + 1})`)
            .className = "timeline-item timeline-selected";
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        this.#initInnerHTML += `<div id="_timeline_numbers">
            ${"<div></div>".repeat(_Animation.length)}
        </div>
        <div id="_timeline_layers">`;
        for (let j = 0; j < Layers.length; j++) {
            this.#initInnerHTML += "<div class='layer'>";
            for (let i = 0; i < _Animation.length; i++) {
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