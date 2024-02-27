const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const outputFolder = path.join(__dirname, 'output');

const imageSize = 256;

const inputFolder = path.join(__dirname, 'input');

// All input paths are relative to the input folder
let inputPaths = [];
fs.readdirSync(inputFolder).forEach(file => {
    inputPaths.push(path.join(inputFolder, file));
});

const inputImages = inputPaths.map(inputPath => {
    return loadImage(inputPath);
});

Promise.all(inputImages).then(inputImages => {
    ResizeImages(inputImages);
});

function ResizeImages(inputImages) {
    console.log('Resizing images...');
    
    for (let i = 0; i < inputImages.length; i++) {
        const canvas = createCanvas(imageSize, imageSize);
        const ctx = canvas.getContext('2d');
        
        const inputImage = inputImages[i];

        ctx.drawImage(inputImage, 0, 0, imageSize, imageSize);

        const buffer = canvas.toBuffer('image/png');
        
        const fileName = inputPaths[i].split('\\').pop();
        const outputFilePath = path.join(outputFolder, fileName);

        console.log(`File Name: ${fileName}`);
        console.log(`Writing file: ${outputFilePath}`);

        fs.writeFileSync(outputFilePath, buffer);
    }
}