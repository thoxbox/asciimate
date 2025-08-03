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
    return toJSONFormat(layers);
}

/** @returns {Layers} */
function load() {
    
}

export { save, load }