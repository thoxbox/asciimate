import Timeline from "../Timeline.js";
import { $, $$ } from "../utils.js";
import HoveredElement from "../HoveredElement.js";

class TimelineComponent extends HTMLElement {
    static render() {
        $$(".timeline-item").forEach(el => el.className = "timeline-item");
        $$(`.timeline-item:nth-child(${Timeline.frame + 1})`).forEach(el => {
            el.classList.add("timeline-selected-same-column");
        });
        $$(`.layer:nth-child(${Timeline.layer + 1}) > div`).forEach(el => {
            el.classList.add("timeline-selected-same-row");
        });
        $(`.layer:nth-child(${Timeline.layer + 1}) > div:nth-child(${Timeline.frame + 1})`)
            .className = "timeline-item timeline-selected";
    }
    static #initInnerHTML = "";
    static #elementLoaded = false;
    static #init = () => {
        this.#initInnerHTML = "";
        this.#initInnerHTML += `<div id="_timeline_numbers">
            ${"<div></div>".repeat(Timeline.framesLength)}
        </div>
        <div id="_timeline_layers">`;
        for (let j = 0; j < Timeline.layersLength; j++) {
            this.#initInnerHTML += "<div class='layer'>";
            for (let i = 0; i < Timeline.framesLength; i++) {
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
        this.render();
    }
    updateDimensions() {
        this.innerHTML = TimelineComponent.#initInnerHTML;
    }
    connectedCallback() {
        if (!TimelineComponent.#elementLoaded) {
            TimelineComponent.#elementLoaded = true;
            TimelineComponent.#init();
        }
        this.innerHTML = TimelineComponent.#initInnerHTML;
        this.addEventListener("click", e => {
            if(!HoveredElement.get().classList.contains("timeline-item")) {
                return;
            }
            const x = HoveredElement.get().getAttribute("data-x")
            const y = HoveredElement.get().getAttribute("data-y")
            Timeline.set(x, y);
        })
        TimelineComponent.render();
    }
}
customElements.define("timeline-", TimelineComponent);

export default TimelineComponent;