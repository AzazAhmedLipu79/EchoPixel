const fs = require('fs');

const imagePath = 'enc-output.bmp';

function readBinaryFile(filePath) {
    return fs.readFileSync(filePath); // Synchronous read
}

function parseBmpHeader(buffer) {
    // BMP header structure: https://en.wikipedia.org/wiki/BMP_file_format#Bitmap_file_header
    const header = {
        signature: buffer.toString('utf-8', 0, 2),
        fileSize: buffer.readUInt32LE(2),
        reserved1: buffer.readUInt16LE(6),
        reserved2: buffer.readUInt16LE(8),
        dataOffset: buffer.readUInt32LE(10),
        headerSize: buffer.readUInt32LE(14),
        width: buffer.readUInt32LE(18),
        height: buffer.readUInt32LE(22),
        colorPlanes: buffer.readUInt16LE(26),
        bitsPerPixel: buffer.readUInt16LE(28),
        compression: buffer.readUInt32LE(30),
        imageSize: buffer.readUInt32LE(34),
        xPixelsPerMeter: buffer.readUInt32LE(38),
        yPixelsPerMeter: buffer.readUInt32LE(42),
        colorsUsed: buffer.readUInt32LE(46),
        importantColors: buffer.readUInt32LE(50)
    };
    return header;
}

function extractPixelData(buffer, dataOffset, width, height, bitsPerPixel) {

    const bytesPerPixel = bitsPerPixel / 8; // 1 byte = 8 bits
    const pixelData = buffer.slice(dataOffset, dataOffset + width * height * bytesPerPixel); // Extract pixel data

    const pixels = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * bytesPerPixel;
            const b = pixelData[index];
            const g = pixelData[index + 1];
            const r = pixelData[index + 2];
            row.push({ r, g, b });
        }
        pixels.push(row);
    }
    return pixels;
}

function downscaleImage(pixels, newWidth, newHeight) {

    const oldWidth = pixels[0].length; 
    const oldHeight = pixels.length;
    const ratioX = oldWidth / newWidth;
    const ratioY = oldHeight / newHeight;

    const newPixels = [];
    for (let y = 0; y < newHeight; y++) {
        const row = [];
        for (let x = 0; x < newWidth; x++) {
            const startX = Math.floor(x * ratioX);
            const endX = Math.floor((x + 1) * ratioX);
            const startY = Math.floor(y * ratioY);
            const endY = Math.floor((y + 1) * ratioY);

            let r = 0, g = 0, b = 0, count = 0;
            for (let yy = startY; yy < endY; yy++) {
                for (let xx = startX; xx < endX; xx++) {
                    r += pixels[yy][xx].r;
                    g += pixels[yy][xx].g;
                    b += pixels[yy][xx].b;
                    count++;
                }
            }
            row.push({ r: Math.floor(r / count), g: Math.floor(g / count), b: Math.floor(b / count) });
        }
        newPixels.push(row);
    }
    return newPixels;
}

 

function displayImageInTerminal(pixels) {
    for (let y = 0; y < pixels.length; y += 2) {
        let rowStr = '';
        for (let x = 0; x < pixels[0].length; x++) {
            const topPixel = pixels[y][x];
            const bottomPixel = pixels[y + 1] ? pixels[y + 1][x] : topPixel;
            rowStr += `\x1b[38;2;${topPixel.r};${topPixel.g};${topPixel.b}m\x1b[48;2;${bottomPixel.r};${bottomPixel.g};${bottomPixel.b}m▄\x1b[0m`; // ANSI escape code
        }
        console.log(rowStr); // Print row
    }
}

// Read and process the BMP file
const binaryData = readBinaryFile(imagePath);
const bmpInfo = parseBmpHeader(binaryData);
 

const pixels = extractPixelData(binaryData, bmpInfo.dataOffset, bmpInfo.width, bmpInfo.height, bmpInfo.bitsPerPixel);

// Downscale the image if necessary
const maxWidth = 20; // Adjust based on your terminal width
const maxHeight = 20; // Adjust based on your terminal height
const newWidth = Math.min(maxWidth, bmpInfo.width);
const newHeight = Math.min(maxHeight, bmpInfo.height);

const scaledPixels = downscaleImage(pixels, newWidth, newHeight);

// Display the image in the terminal
displayImageInTerminal(scaledPixels);
