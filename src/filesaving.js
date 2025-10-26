import Timeline from "./Timeline.js";
import Frames from "./Frames.js";
import Drawing from "./Drawing.js";
import { pipe, asyncPipe, toMatrix } from "./utils.js";
import publisher from "./publisher.js"

/** 
 * @param {Timeline} layers
 * @returns {Blob}
 * */
function save(layers) {
    /** 
     * @param {Timeline} layers
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
        x => x.map(layer => pipe(
            diffLayer,
            x => runLengthEncode(x.flat()),
            encodeLayer,
        )(layer)).join("\n"),
        x => JSON.stringify({
            width: Drawing.width,
            height: Drawing.height,
            layers: Timeline.layersLength,
            frames: Frames.length,
            version: publisher.version,
        }) + "\n" + x,
        saveFile,
    )(layers);
}

class Token {
    static repeat = Symbol("repeat");
    static value = Symbol("value");
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
    clone() {
        return new Token(this.type, this.value);
    }
}
/** 
 * @param {Blob} blob
 * @returns {Promise<Timeline>}
 * */
function load(blob) {
    /** @param {Blob} blob  */
    function loadFile(blob) {
        return blob.text();
    }
    const noChange = Symbol("no change");
    /** @param {string} layer @returns {Token[]} */
    function tokenizeLayer(layer) {
        const noChangeEncoding = "\u0000";
        const repeatEncoding = Array(10)
            .fill()
            .map((_, i) => String.fromCharCode(i + 22))
            .map((x, i) => [x, new Token(Token.repeat, String(i))]);
        const decodeMatch = new Map([
            ...repeatEncoding,
            [noChangeEncoding, new Token(Token.value, noChange)],
        ]);
        return layer.split("")
            .map(x => decodeMatch.get(x) ?? new Token(Token.value, x));
    }
    /** @param {Token[]} tokens */
    function mergeTokens(tokens) {
        let mergedToken;
        let mergedTokens = [];
        tokens.forEach((token, i) => {
            token = token.clone();
            if(i === 0) {
                mergedToken = token;
                return;
            }
            if(token.type !== mergedToken.type) {
                mergedTokens.push(mergedToken);
                mergedToken = token;
                return;
            }
            if(token.type === Token.repeat) {
                mergedToken.value += String(token.value);
                return;
            }
            if(token.type === Token.value) {
                const repeatToken = new Token(Token.repeat, "1");
                mergedTokens.push(mergedToken.clone(), repeatToken);
                mergedToken = token;
                return;
            }
        });
        mergedTokens.push(mergedToken);
        return mergedTokens;
    }
    /** 
     * @param {Token[]} tokens
     * @returns {{repeat: number, value: string | symbol}[]} */
    function toRunLengthEncodeFormat(tokens) {
        return pipe(
            x => toMatrix(x, 2),
            x => x.map(x => ({repeat: x[0].value, value: x[1].value})),
        )(tokens);
    }
    /** @param {{repeat: number, value: string | symbol}[]} encoded */
    function runLengthDecode(encoded) {
        return pipe(
            x => x.map(y => ({repeat: y.repeat, value: y.value})),
            x => x.flatMap(y => Array(+y.repeat).fill(y.value)),
            x => toMatrix(x, projectData.width * projectData.height),
        )(encoded);
    }
    /** @param {string[]} frame1 @param {string | symbol[]} frame2 */
    function unDiffFrames(frame1, frame2) {
        return frame2.map((char, i) =>
            char === noChange ? frame1[i] : char);
    }
    /** @param {(string | symbol)[][]} layer */
    function unDiffLayer(layer) {
        return layer.reduce((acc, frame, i, arr) => {
            if(i === 0) {return acc.concat([frame])}
            return acc.concat([unDiffFrames(acc.at(-1), frame)]);
        }, []);
    }
    /** @param {string[][][]} JSONFormat */
    function toLayersObject(JSONFormat) {
        return new Timeline(null, JSONFormat.map(layer => 
            new Frames(null, layer.map(x => 
                new Drawing(null, toMatrix(x, projectData.width))
            ))
        ));
    }
    let projectData;
    return asyncPipe(
        loadFile,
        x => x.split("\n"),
        x => {
            projectData = JSON.parse(x[0]);
            return x.slice(1);
        },
        x => x.map(layer => pipe(
            tokenizeLayer,
            mergeTokens,
            toRunLengthEncodeFormat,
            runLengthDecode,
            unDiffLayer,
        )(layer)),
        toLayersObject,
        x => ({layers: x, projectData: projectData}),
    )(blob);
}

export { save, load }