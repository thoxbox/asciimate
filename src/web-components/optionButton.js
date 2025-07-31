class OptionButton extends HTMLElement {
    checked = false;
    name = "";
    setChecked(bool) {
        if (bool === this.checked) {
            return;
        }
        this.onchange();
        if (bool) {
            const options = $$(`option-[name="${this.name}"]`);
            OptionButton.onswitch([...options].indexOf(this), this.name);
            $$(`option-[name="${this.name}"]`).forEach(el => el.setChecked(false));
        }
        this.checked = bool;
        this.setAttribute("checked", this.checked);
    }
    onchange = () => { };
    static onswitch = () => { };
    connectedCallback() {
        this.style.display = 'block';
        this.name = this.getAttribute("name");
        this.checked = !!this.getAttribute("checked");
        this.setAttribute("checked", this.checked);
        this.onclick = () => {
            this.setChecked(true);
        }
    }
}
customElements.define("option-", OptionButton);

export default OptionButton;