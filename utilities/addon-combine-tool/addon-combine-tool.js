// This tool is used to combine the transparent PNGs of the addons into a
// single image with the rarity border.
// The tool is used by running `node addon-combine-tool.js` in the terminal.

// Uses the addon-list.json file in the same directory.

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const addonList = require('./addon-list.json');
const outputFolder = path.join(__dirname, 'output');

const rarityPaths = [
    { path: './rarity-images/common.png', index: 0 },
    { path: './rarity-images/uncommon.png', index: 1 },
    { path: './rarity-images/rare.png', index: 2 },
    { path: './rarity-images/veryrare.png', index: 3 },
    { path: './rarity-images/ultrarare.png', index: 4 }
];

let addonPaths = [];
for (let i = 0; i < addonList.length; i++) {
    const addon = addonList[i];
    const addonPath = path.join(__dirname, addon.addonIcon);
    addonPaths.push(addonPath);
}

const rarityImages = rarityPaths.map(rarity => {
    return loadImage(path.join(__dirname, rarity.path));
});

const addonImages = addonPaths.map(addon => {
    return loadImage(addon);
});

Promise.all(rarityImages).then(rarityImages => {
    Promise.all(addonImages).then(addonImages).then(addonImages => {
        CombineAddons(addonImages, rarityImages);
    });
});

function CombineAddons(addonImages, rarityImages) {
    console.log('Combining addons...');
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < addonImages.length; i++) {
        const rarityIndex = addonList[i]["Rarity"];
        const rarityImage = rarityImages[rarityIndex];
        const addonImage = addonImages[i];

        ctx.drawImage(rarityImage, 0, 0, 256, 256);
        ctx.drawImage(addonImage, 0, 0, 256, 256);

        const buffer = canvas.toBuffer('image/png');
        
        const fileName = addonPaths[i].split('\\').pop();
        const outputFilePath = path.join(outputFolder, fileName);

        console.log(`File Name: ${fileName}`);
        console.log(`Writing file: ${outputFilePath}`);

        fs.writeFileSync(outputFilePath, buffer);
    }
}