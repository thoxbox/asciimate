class Action {
    /** @type {Action[]} */
    static #actions = [];
    /** @type {Action[]} */
    static #undos = [];
    /** @param {Action} action */
    static add(action) {
        this.#actions.push(action);
        this.#undos = [];
    }
    static undo() {
        if (this.#actions.length === 0) {
            return;
        }
        const action = this.#actions.pop();
        action.#undo();
        this.#undos.push(action);
    }
    /** @type {Function} */
    #undo = () => {};
    /** @type {Function} */
    #redo = () => {};
    constructor({ undo = () => {}, redo = () => {} }) {
        this.#undo = undo;
        this.#redo = redo;
    }
}

export default Action;
