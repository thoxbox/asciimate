const publisher = Object.freeze({
    name: "Asciimate",
    fileExtension: ".asciimate",
    mimeType: "application/asciimate",
    version: "1.0.0"
});
console.assert(publisher.name && publisher.fileExtension && publisher.mimeType);

export default publisher;