import { $ } from "./utils.js";

class FileSaver {
    /** 
     * @param {Blob} blob
     * @param {string} mimeType
     * @param {string | string[]} fileExtension
     * @param {string} fileName
     * @param {string} description */
    static async save(blob, fileName, mimeType = null, fileExtension = null, description = null) {
        if(window.showOpenFilePicker === undefined) {
            const downloader = document.createElement("a");
            const url = URL.createObjectURL(blob);
            document.body.appendChild(downloader);
            downloader.href = url;
            downloader.download = fileName;
            downloader.click();
            downloader.remove();
            URL.revokeObjectURL(url);
            return;
        }
        const [fileHandle] = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
                {
                    description : description ?? "",
                    accept: {
                        [mimeType ?? "application/unknown"]: [fileExtension ?? []].flat()
                    },
                },
            ],
        });
        const writer = await fileHandle.createWritable();
        await writer.write(blob);
        await writer.close();
    }
    /** @returns {Blob} */
    static load() {
        
    }
}

export default FileSaver;