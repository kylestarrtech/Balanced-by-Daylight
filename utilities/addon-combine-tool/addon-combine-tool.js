// This tool is used to combine the transparent PNGs of the addons into a
// single image with the rarity border.
// The tool is used by running `node addon-combine-tool.js` in the terminal.

// Uses the addon-list.json file in the same directory.

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const addonList = require('./addon-list.json');
const outputFolder = path.join(__dirname, 'output');

const combineMode = "bruteForce";

let rarityPaths = [];
if (combineMode == "readList") {
    rarityPaths = [
        { path: `${__dirname}/rarity-images/common.png`, index: 0 }, // This is the common rarity
        { path: `${__dirname}/rarity-images/uncommon.png`, index: 1 }, // This is the uncommon rarity
        { path: `${__dirname}/rarity-images/rare.png`, index: 2 }, // This is the rare rarity
        { path: `${__dirname}/rarity-images/veryrare.png`, index: 3 }, // This is the very rare rarity
        { path: `${__dirname}/rarity-images/ultrarare.png`, index: 4 } // This is the ultra rare rarity
    ];
} else if (combineMode == "bruteForce") {
    rarityPaths = fs.readdirSync(path.join(__dirname, 'rarity-images')).map(rarity => {
        return { path: path.join(__dirname, 'rarity-images', rarity), index: 0 };
    });
}

let addonPaths = [];

if (combineMode == "readList") {
    for (let i = 0; i < addonList.length; i++) {
        const addon = addonList[i];
        const addonPath = path.join(__dirname, addon.addonIcon);
        addonPaths.push(addonPath);
    }
} else if (combineMode == "bruteForce") {
    addonPaths = fs.readdirSync(path.join(__dirname, 'addon-images')).map(addon => {
        return path.join(__dirname, 'addon-images', addon);
    });
}

const rarityImages = rarityPaths.map(rarity => {
    return loadImage(rarity.path);
});

const addonImages = addonPaths.map(addon => {
    return loadImage(addon);
});

/**
 * "readList": Combines the addons based on the addon-list.json file.
 * "bruteForce": Creates every possible combination of addons and rarities.
 */

if (combineMode == "readList") {
    Promise.all(rarityImages).then(rarityImages => {
        Promise.all(addonImages).then(addonImages).then(addonImages => {
            CombineAddons(addonImages, rarityImages);
        });
    });
} else if (combineMode == "bruteForce") {
    Promise.all(rarityImages).then(rarityImages => {
        Promise.all(addonImages).then(addonImages => {
            BruteForceCombine(addonImages, rarityImages);
        });
    });
}

function CombineAddons(addonImages, rarityImages) {
    console.log('Combining addons...');
    const canvas = createCanvas(300, 300);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < addonImages.length; i++) {
        const rarityIndex = addonList[i]["Rarity"];
        const rarityImage = rarityImages[rarityIndex];
        const addonImage = addonImages[i];

        ctx.drawImage(rarityImage, 22, 22, 256, 256);
        ctx.drawImage(addonImage, 22, 22, 256, 256);

        const buffer = canvas.toBuffer('image/png');
        
        const fileName = addonPaths[i].split('\\').pop();
        const outputFilePath = path.join(outputFolder, fileName);

        console.log(`File Name: ${fileName}`);
        console.log(`Writing file: ${outputFilePath}`);

        fs.writeFileSync(outputFilePath, buffer);
    }
}

function BruteForceCombine(addonImages, rarityImages) {
    console.log('Brute force combining addons...');
    const canvas = createCanvas(300, 300);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < addonImages.length; i++) {
        for (let j = 0; j < rarityImages.length; j++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const rarityImage = rarityImages[j];
            const addonImage = addonImages[i];

            ctx.drawImage(rarityImage, 22, 22, 256, 256);
            ctx.drawImage(addonImage, 22, 22, 256, 256);

            const buffer = canvas.toBuffer('image/png');
            
            let fileName = addonPaths[i].split('\\').pop();
            if (j > 0) {
                fileName = fileName.replace('.png', `-${j}.png`);
            }

            const outputFilePath = path.join(outputFolder, fileName);

            console.log(`Writing file: ${outputFilePath}`);

            fs.writeFileSync(outputFilePath, buffer);
        }
    }
}