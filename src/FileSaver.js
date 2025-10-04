import { $ } from "./utils.js";

class FileSaver {
    /** 
     * @param {string} fileName
     * @param {string} mimeType
     * @param {string | string[]} fileExtension
     * @param {string} description */
    static createFileOptions(
        fileName,
        mimeType = null,
        fileExtension = null,
        description = null,
    ) {
        return {
            suggestedName: fileName,
            types: [
                {
                    description : description ?? "",
                    accept: {
                        [mimeType ?? "application/unknown"]: [fileExtension ?? []].flat()
                    },
                },
            ],
        }
    }
    /** @param {Blob} blob @param {Object} options */
    static async save(blob, options) {
        if(options.suggestedName === undefined) {
            throw new Error("File options must include a suggestedName for browser compatibility.");
        }
        if(window.showSaveFilePicker === undefined) {
            const downloader = document.createElement("a");
            const url = URL.createObjectURL(blob);
            document.body.appendChild(downloader);
            downloader.href = url;
            downloader.download = options.suggestedName;
            downloader.click();
            downloader.remove();
            URL.revokeObjectURL(url);
            return;
        }
        const fileHandle = await window.showSaveFilePicker(options);
        const writer = await fileHandle.createWritable();
        await writer.write(blob);
        await writer.close();
    }
    /** 
     * @param {Object} options
     * @returns {Promise<File>} */
    static async load(options) {
        if(window.showOpenFilePicker === undefined) {
            return await this.#legacyLoad(options);
        }
        const [fileHandle] = await window.showOpenFilePicker(options);
        return await fileHandle.getFile();
    }
    /** 
     * @param {Object} options
     * @returns {Promise<File>} */
    static async #legacyLoad(options) {
        const downloader = document.createElement("input");
        downloader.type = "file";
        downloader.accept = options.types.flatMap(({accept}) => 
            Object.keys(accept).concat(Object.values(accept).flat())
        ).join(", ");
        downloader.dispatchEvent(new MouseEvent("click"));
        return new Promise((resolve, reject) => {
            downloader.addEventListener("change", e => {
                resolve(e.currentTarget.files[0]);
            }, {once: true});
            downloader.addEventListener("cancel", () => {
                reject("User cancelled file open");
            }, {once: true});
        });
    }
}

export default FileSaver;