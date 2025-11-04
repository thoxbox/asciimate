class Keyboard {
    static #keys = new Map();
    static get keys() {
        return Object.fromEntries(this.#keys.entries());
    }
    static #initialize = (() => {
        document.addEventListener("keydown", e => {
            this.#keys.set(e.code, e.key);
        });
        document.addEventListener("keyup", e => {
            this.#keys.delete(e.code);
        });
    })();
}
export default Keyboard;
