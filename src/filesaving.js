import Layers from "./Layers.js";
import Frames from "./Frames.js";
import Drawing from "./Drawing.js";

/** @param {Layers} layers */
function save(layers) {
    function toJSONFormat(layers) {
        return layers.layers.map(layer => {
            return layer.animation.map(frame => {
                return frame.drawing.flat()
            });
        });
    }
    const noChange = Symbol("no change");
    /** @param {string[]} frame1 @param {string[]} frame2  */
    function diffFrames(frame1, frame2) {
        let diff = [];
        frame2.forEach((char, i) => {
            if (char === frame1[i]) {
                diff.push(noChange);
            }
            else {
                diff.push(char);
            }
        });
        return diff;
    }
    return toJSONFormat(layers);
}

/** @returns {Layers} */
function load() {
    
}

export { save, load }