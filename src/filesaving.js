import Layers from "./Layers.js";
import Frames from "./Frames.js";
import Drawing from "./Drawing.js";
import { pipe, asyncPipe } from "./utils.js";

/** 
 * @param {Layers} layers
 * @returns {Blob}
 * */
function save(layers) {
    /** 
     * @param {Layers} layers
     * @returns {string[][][]}
     * */
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
    /**
     * @param {{
     *   value: string | symbol,
     *   repeat: number
     * }[]} layer 
     * */
    function encodeLayer(layer) {
        const noChangeEncoding = "\u0000";
        const repeatEncoding = Array(10)
            .fill()
            .map((_, i) => String.fromCharCode(i + 22));
        const encodeRepeat = num =>
            num.toString().split("").map(y => repeatEncoding[y]).join("");
        return layer.map(x => 
            (x.repeat === 1 ? "" : encodeRepeat(x.repeat)) +
            (x.value === noChange ? noChangeEncoding : x.value)
        ).join("");
    }
    function saveFile(file) {
        return new Blob([file], { type: "text/plain" })
    }
    return pipe(
        toJSONFormat,
        x => x.map(layer => diffLayer(layer)),
        x => x.map(layer => runLengthEncode(layer.flat())),
        x => x.map(layer => encodeLayer(layer)).join("\n"),
        x => JSON.stringify({
            width: Drawing.width,
            height: Drawing.height,
            layers: Layers.length,
            frames: Frames.length,
        }) + "\n" + x,
        saveFile,
    )(layers);
}

/** 
 * @param {Blob} blob
 * @returns {Promise<Layers>}
 * */
function load(blob) {
    /** @param {Blob} blob  */
    function loadFile(blob) {
        return blob.text();
    }
    let projectData;
    return asyncPipe(
        loadFile,
        x => x.split("\n"),
        x => {
            projectData = JSON.parse[x[0]]
            return x.slice(1);
        }
    )(blob);
}

export { save, load }