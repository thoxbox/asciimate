class Mouse {
    static #leftClick = false;
    static get leftClick() { return this.#leftClick }
    static #rightClick = false;
    static get rightClick() { return this.#rightClick }
    static #middleClick = false;
    static get middleClick() { return this.#middleClick }
    static #x = 0;
    static get x() { return this.#x }
    static #y = 0;
    static get y() { return this.#y }
    /** @type {-1 | 0 | 1} */
    static #wheel = 0;
    static get wheel() { return this.#wheel }
    static onMouseDown = () => { };
    static onMouseUp = () => { };
    static onMouseMove = () => { };
    static onMouseWheel = () => { };
    /** @param {number} buttons */
    static #setButtonsFromMouseEvent(buttons) {
        const buttonsBinary = buttons
            .toString(2)
            .padStart(3, "0")
            .split("")
            .map(x => !!+x);
        [this.#middleClick, this.#rightClick, this.#leftClick] = buttonsBinary;
    }
    static #initialize = (() => {
        document.addEventListener("mousedown", e => {
            this.#setButtonsFromMouseEvent(e.buttons);
            this.onMouseDown();
        }, { passive: true });
        document.addEventListener("mouseup", e => {
            this.#setButtonsFromMouseEvent(e.buttons);
            this.onMouseUp();
        }, { passive: true });
        document.addEventListener("mousemove", e => {
            this.#x = e.clientX;
            this.#y = e.clientY;
            this.onMouseMove();
        }, { passive: true });
        const mouseWheel = (e) => {
            if (e.deltaY != null) { this.#wheel = Math.sign(e.deltaY) }
            this.onMouseWheel();
        }
        document.addEventListener("wheel", mouseWheel, { passive: true });
        document.addEventListener("DOMMouseScroll", mouseWheel, { passive: true });
    })()
}

export default Mouse;