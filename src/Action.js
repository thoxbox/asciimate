class Action {
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
