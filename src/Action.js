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
