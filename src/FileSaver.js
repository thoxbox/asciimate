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
        if(fileName.suggestedName === null) {
            throw new Error("File options must include a suggestedName for browser compatibility.");
        }
        if(window.showOpenFilePicker === undefined) {
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
        const [fileHandle] = await window.showSaveFilePicker(options);
        const writer = await fileHandle.createWritable();
        await writer.write(blob);
        await writer.close();
    }
    /** @returns {Blob} */
    static load() {
        
    }
}

export default FileSaver;