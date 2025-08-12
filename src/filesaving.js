import Layers from "./Layers.js";
import Frames from "./Frames.js";
import Drawing from "./Drawing.js";

/** @param {Layers} layers */
function save(layers) {
    function toJSONFormat(layers) {
        return layers.layers.map(layer => 
            layer.animation.map(frame => frame.drawing.flat())
        );
    }
    const noChange = Symbol("no change");
    /** @param {string[]} frame1 @param {string[]} frame2  */
    function diffFrames(frame1, frame2) {
        return frame2.map((char, i) =>
            char === frame1[i] ? noChange : char);
    }
    /** @param {(string | symbol)[][]} layer */
    function diffLayer(layer) {
        return layer.map((frame, i, arr) =>
            i > 0 ? diffFrames(arr[i - 1], frame) : frame);
    }
    /** @param {(string | symbol)[]} frame */
    function runLengthEncode(frame) {
        let encoded = [{value: frame[0], repeat: 0}];
        frame.forEach(x => x === encoded.at(-1).value ?
            encoded.at(-1).repeat += 1 :
            encoded.push({value: x, repeat: 1})
        );
        return encoded;
    }
    return toJSONFormat(layers)
        .map(layer => diffLayer(layer))
        .map(layer => runLengthEncode(layer.flat()));
}

/** @returns {Layers} */
function load() {
    
}

export { save, load }