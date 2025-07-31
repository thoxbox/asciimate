class Toggle extends HTMLElement {
    #checked = false;
    set checked(bool) {
        this.#checked = bool;
        this.setAttribute("checked", this.checked);
    }
    get checked() { return this.#checked }
    onchange = () => { }
    connectedCallback() {
        this.style.display = 'block';
        this.checked = !!this.getAttribute("checked");
        this.onclick = () => {
            this.checked = !this.checked;
            this.onchange();
        }
    }
}
customElements.define("toggle-", Toggle);

export default Toggle;