// This tool is used to combine the transparent PNGs of the addons into a
// single image with the rarity border.
// The tool is used by running `node addon-combine-tool.js` in the terminal.

// Uses the addon-list.json file in the same directory.

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

let addonList = [];
try{
   addonList = require('./addon-list.json');
}catch(e){}
const outputFolder = path.join(__dirname, 'output');

const combineMode = "characterMatch";
const characterName = "The Slasher";

let newAddonsList = [];
try {
    const rawData = fs.readFileSync(path.join(__dirname, '../../public/NewAddons.json'));
    newAddonsList = JSON.parse(rawData);
} catch (e) {
    console.error("Could not load NewAddons.json", e);
}

let charAddons = [];
if (combineMode === "characterMatch") {
    const charData = newAddonsList.find(c => c.Name === characterName);
    if (charData) {
        charAddons = charData.Addons;
    }
}

let rarityPaths = [];
if (combineMode == "readList") {
    rarityPaths = [
        { path: `${__dirname}/rarity-images/common.png`, index: 0 }, // This is the common rarity
        { path: `${__dirname}/rarity-images/uncommon.png`, index: 1 }, // This is the uncommon rarity
        { path: `${__dirname}/rarity-images/rare.png`, index: 2 }, // This is the rare rarity
        { path: `${__dirname}/rarity-images/veryrare.png`, index: 3 }, // This is the very rare rarity
        { path: `${__dirname}/rarity-images/visceral.png`, index: 4 } // This is the ultra rare rarity
    ];
} else if (combineMode == "bruteForce" || combineMode == "characterMatch") {
    // Collect paths and sort by their filename (assuming they are named like '0.png', '1.png', etc.)
    rarityPaths = fs.readdirSync(path.join(__dirname, 'rarity-images')).map(rarity => {
        return { path: path.join(__dirname, 'rarity-images', rarity), index: parseInt(rarity.split('.')[0]) || 0 };
    });
    rarityPaths.sort((a, b) => a.index - b.index);
}

let addonPaths = [];

if (combineMode == "readList") {
    for (let i = 0; i < addonList.length; i++) {
        const addon = addonList[i];
        const addonPath = path.join(__dirname, addon.addonIcon);
        addonPaths.push(addonPath);
    }
} else if (combineMode == "bruteForce" || combineMode == "characterMatch") {
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
 * "characterMatch": Matches images by name to a character in NewAddons.json and combines with the correct rarity, or creates every possible combination if no match is found.
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
} else if (combineMode == "characterMatch") {
    Promise.all(rarityImages).then(rarityImages => {
        Promise.all(addonImages).then(addonImages => {
            CharacterMatchCombine(addonImages, rarityImages);
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
            fileName = fileName.split('/').pop();
            if (j > 0) {
                fileName = fileName.replace('.png', `-${j}.png`);
            }

            const outputFilePath = path.join(outputFolder, fileName);

            console.log(`Writing file: ${outputFilePath}`);

            fs.writeFileSync(outputFilePath, buffer);
        }
    }
}

function CharacterMatchCombine(addonImages, rarityImages) {
    console.log(`Character match combining addons for ${characterName}...`);
    const canvas = createCanvas(300, 300);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < addonImages.length; i++) {
        let fullFileName = addonPaths[i].split('\\').pop();
        fullFileName = fullFileName.split('/').pop();
        const baseName = fullFileName.substring(0, fullFileName.lastIndexOf('.'));

        const matchedAddon = charAddons.find(a => {
            if (!a.addonIcon) return false;
            let jsonFileName = a.addonIcon.split('\\').pop();
            jsonFileName = jsonFileName.split('/').pop();
            const jsonBaseName = jsonFileName.substring(0, jsonFileName.lastIndexOf('.'));
            return jsonBaseName === baseName;
        });

        if (matchedAddon) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const rarityIndex = matchedAddon.Rarity;
            let rarityImageIndex = rarityPaths.findIndex(p => p.index === rarityIndex);
            if (rarityImageIndex === -1) {
                rarityImageIndex = rarityIndex; // fallback
            }
            const rarityImage = rarityImages[rarityImageIndex];
            const addonImage = addonImages[i];

            if (rarityImage) {
                ctx.drawImage(rarityImage, 22, 22, 256, 256);
            }
            ctx.drawImage(addonImage, 22, 22, 256, 256);

            const buffer = canvas.toBuffer('image/png');
            const outputFilePath = path.join(outputFolder, fullFileName);
            
            console.log(`Writing file (matched): ${outputFilePath}`);
            fs.writeFileSync(outputFilePath, buffer);
        } else {
            console.log(`No match for ${fullFileName}, defaulting to brute force...`);
            for (let j = 0; j < rarityImages.length; j++) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const rarityImage = rarityImages[j];
                const addonImage = addonImages[i];

                ctx.drawImage(rarityImage, 22, 22, 256, 256);
                ctx.drawImage(addonImage, 22, 22, 256, 256);

                const buffer = canvas.toBuffer('image/png');
                
                let outFileName = fullFileName;
                if (j > 0) {
                    outFileName = outFileName.replace('.png', `-${j}.png`);
                }

                const outputFilePath = path.join(outputFolder, outFileName);

                console.log(`Writing file: ${outputFilePath}`);

                fs.writeFileSync(outputFilePath, buffer);
            }
        }
    }
}