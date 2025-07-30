/** @param {number} value @param {number} min @param {number} max */
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
/** @param {number} value @param {number} min @param {number} max */
function inRange(value, min, max) {
    return min <= value && value <= max;
}
/** @param {number} m @param {number} n */
function mod(n, m) {
    return ((n % m) + m) % m;
}

/** @param {string} query @returns {HTMLElement} */
const $ = query => document.querySelector(query);
/** @param {string} query @returns {NodeListOf<HTMLElement>} */
const $$ = query => document.querySelectorAll(query);

export { clamp, inRange, mod, $, $$ }