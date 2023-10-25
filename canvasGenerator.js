const fs = require('fs')
const pako = require('pako')
const { createCanvas, loadImage } = require('canvas')

const Killers = require('./public/Killers.json');
const Perks = require('./public/Perks/dbdperks.json');
const Items = require('./public/Items.json');
const Offerings = require('./public/Offerings.json');

const BalancingTitles = [
    "Outrun the Fog (OTF)",
    "Dead by Daylight League (DBDL)",
    "Champions of the Fog (COTF)",
    "Davy Jones League",
    "L-Tournament"
]

function BeginGenerationImport(data, callback) {
    //console.log("Importing build...");

    let decompressedText = null;
    
    try {
        const compressedDataDecoded = atob(data);
        //console.log("Build is decoded, but not decompressed.");
    
        const inflate = pako.inflate(new Uint8Array([...compressedDataDecoded].map(char => char.charCodeAt(0))));
        decompressedText = new TextDecoder().decode(inflate);
    } catch(err) {
        //console.error(err);
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not decrypy and decompress."
        })
        return;
    }
    //console.log("Build is decompressed, but not parsed.");

    //console.log(decompressedText);
    let importedBuild = null;
    try {
        importedBuild = JSON.parse(decompressedText);
        //console.log("Build is valid JSON!");
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not parse build JSON."
        })
        return;
    }

    // What does the canvas need?
    // - Killer Name
    // - Killer Lore Image
    // - Survivor Perk Icons
    // - Survivor Offering Icons
    // - Survivor Item Icons
    // - Survivor Addon Icons

    let exampleImageGenObject = {
        KillerName: "",
        KillerLoreImage: "",
        BalancingTitle: "",
        SurvivorPerkIcons: [[], [], [], []],
        SurvivorOfferingIcons: [],
        SurvivorItemIcons: [],
        SurvivorAddonIcons: [[], [], [], []]
    }

    try {
        // Get Killer Name
        exampleImageGenObject.KillerName = Killers[importedBuild.selectedKiller];
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not find killer name."
        })
        return;
    }

    try {
        // Get Killer Lore Image
        // First get the killer's name without spaces and omit "The"
        let killerName = Killers[importedBuild.selectedKiller].replace("The", "");
        killerName = killerName.replace(/\s/g, "");

        // Then get the lore image
        exampleImageGenObject.KillerLoreImage = `./canvas-image-library/lore/${killerName}.png`;
    
        // Check if the image exists
        if (!fs.existsSync(exampleImageGenObject.KillerLoreImage)) {
            throw "Image does not exist!";
        }
    
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not find killer lore image."
        })
        return;
    }

    try {
        // Get Balancing Title
        if (importedBuild.customBalancingOverride) {
            exampleImageGenObject.BalancingTitle = "Custom Balancing"
        } else {
            exampleImageGenObject.BalancingTitle = BalancingTitles[importedBuild.currentBalancingIndex];
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not find balancing title."
        })
        return;
    }

    try {
        // Get Survivor Perk Icons
        for (var survivorIndex = 0; survivorIndex < importedBuild.survivorPerksId.length; survivorIndex++) {
            for (var perkIndex = 0; perkIndex < importedBuild.survivorPerksId[survivorIndex].length; perkIndex++) {

                let desiredID = importedBuild.survivorPerksId[survivorIndex][perkIndex];

                // If the perk is null, push a blank image
                if (desiredID == null) {
                    exampleImageGenObject.SurvivorPerkIcons[survivorIndex].push('./canvas-image-library/Perks/blank.png');
                    continue;
                }

                // Get the perk icon
                for (const perk of Perks) {
                    //console.log(perk);

                    if (desiredID == perk["id"]) {

                        let endIconPath = "";

                        // Get the name of the perk without file path
                        let perkName = perk["icon"].split("/").pop();

                        // Append the canvas-image-library path to the start
                        let PerkRole = perk["survivorPerk"] ? "Survivors" : "Killers";
                        endIconPath = `./canvas-image-library/Perks/${PerkRole}/${perkName}`;

                        // Change .webp to .png
                        endIconPath = endIconPath.replace(".webp", ".png");

                        // Check if the image exists
                        if (!fs.existsSync(endIconPath)) {
                            throw "Image does not exist!";
                        }

                        exampleImageGenObject.SurvivorPerkIcons[survivorIndex].push(endIconPath);
                        

                        break;
                    }
                }
            }
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Perk icons."
        })
        return;
    }

    try {
        // Get Offering Icons
        let isSurvivor = true;
        let IterableOfferings = isSurvivor ? Offerings["Survivor"] : Offerings["Killer"];
        for (var offeringIndex = 0; offeringIndex < importedBuild.survivorOfferingsId.length; offeringIndex++) {

            let desiredID = importedBuild.survivorOfferingsId[offeringIndex];

            // If the offering is null, push a blank image
            if (desiredID == null) {
                exampleImageGenObject.SurvivorOfferingIcons.push('./canvas-image-library/Offerings/blank.png');
                continue;
            }

            // Get the offering icon
            for (const offering of IterableOfferings) {
                //console.log(offering);

                if (desiredID == offering["id"]) {
                    let endIconPath = "";

                    // Get the name of the offering without file path
                    let offeringName = offering["icon"].split("/").pop();

                    // Append the canvas-image-library path to the start
                    endIconPath = `./canvas-image-library/Offerings/${offeringName}`;

                    // Change .webp to .png
                    endIconPath = endIconPath.replace(".webp", ".png");

                    // Check if the image exists
                    if (!fs.existsSync(endIconPath)) {
                        throw "Image does not exist!";
                    }

                    exampleImageGenObject.SurvivorOfferingIcons.push(endIconPath);
                    break;
                }
            }
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Offering icons."
        })
        return;
    }

    try {
        // Get Survivor Item Icons
        for (var itemIndex = 0; itemIndex < importedBuild.survivorItemsId.length; itemIndex++) {
                
            let desiredID = importedBuild.survivorItemsId[itemIndex];
        
            // If the item is null, push a blank image
            if (desiredID == null) {
                    exampleImageGenObject.SurvivorItemIcons.push('./canvas-image-library/Items/blank.png');
                    continue;        
            }

            // Get the item icon
            for (const item of Items["Items"]) {
                //console.log(item);

                if (desiredID == item["id"]) {
                    let endIconPath = "";

                    // Get the name of the item without file path
                    let itemName = item["icon"].split("/").pop();

                    // Append the canvas-image-library path to the start
                    endIconPath = `./canvas-image-library/Items/${itemName}`;

                    // Change .webp to .png
                    endIconPath = endIconPath.replace(".webp", ".png");

                    // Check if the image exists
                    if (!fs.existsSync(endIconPath)) {
                        throw "Image does not exist!";
                    }

                    exampleImageGenObject.SurvivorItemIcons.push(endIconPath);
                    break;
                }
            }
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Item icons."
        });
        return;
    }

    try {
        // Get Survivor Addon Icons
        for (var survivorIndex = 0; survivorIndex < importedBuild.survivorAddonInfo.length; survivorIndex++) {
            let currentAddonInfo = importedBuild.survivorAddonInfo[survivorIndex];
            let currentAddons = currentAddonInfo[0];
            let currentItemType = currentAddonInfo[1];

            for (var addonIndex = 0; addonIndex < currentAddons.length; addonIndex++) {
                let desiredID = currentAddons[addonIndex];

                // If the addon is null, push a blank image
                if (desiredID == null) {
                    exampleImageGenObject.SurvivorAddonIcons[survivorIndex].push('./canvas-image-library/Addons/blank.png');
                    continue;
                }

                let currentItemTypeIndex = null;

                // Get the index of the current item type
                for (var i = 0; i < Items["ItemTypes"].length; i++) {
                    if (Items["ItemTypes"][i]["Name"] == currentItemType) {
                        currentItemTypeIndex = i;
                        break;
                    }
                }

                if (currentItemTypeIndex == null) {
                    console.error(`Couldn't find index for item type ${currentItemType}`);
                    return;
                }

                // Get the addon icon
                for (const addon of Items["ItemTypes"][currentItemTypeIndex]["Addons"]) {
                    //console.log(addon);

                    if (desiredID == addon["id"]) {
                        let endIconPath = "";

                        // Get the name of the addon without file path
                        let addonName = addon["icon"].split("/").pop();

                        // Append the canvas-image-library path to the start
                        endIconPath = `./canvas-image-library/Addons/${addonName}`;

                        // Change .webp to .png
                        endIconPath = endIconPath.replace(".webp", ".png");

                        // Check if the image exists
                        if (!fs.existsSync(endIconPath)) {
                            throw "Image does not exist!";
                        }

                        exampleImageGenObject.SurvivorAddonIcons[survivorIndex].push(endIconPath);
                        break;
                    }
                }
            }
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Addon icons."
        });
        return;
    }


    //console.log(exampleImageGenObject);
    GenerateImage(exampleImageGenObject, callback);
}


async function GenerateImage(importedBuild, callback) {
    // Tracks all promises to be resolved before writing to file
    let promises = [];
    
    const width = 1280
    const height = 720
    
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    
    context.fillStyle = '#100f16'
    context.fillRect(0, 0, width, height)
    
    // Generate Killer going against text
    
    context.font = '400 24pt Roboto'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    const TitlePrefixText = 'Going against: '
    
    context.fillStyle = '#fff'
    context.fillText(TitlePrefixText, 10, 10, width);
    
    let titleTextMetrics = context.measureText(TitlePrefixText);
    let titleTextWidth = titleTextMetrics.width;
    let titleTextHeight = titleTextMetrics.actualBoundingBoxAscent + titleTextMetrics.actualBoundingBoxDescent;
    context.font = '700 24pt Roboto'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    
    const KillerTitleText = importedBuild["KillerName"];
    context.fillText(KillerTitleText, 10 + titleTextWidth, 10, width);
    
    // Generate Balancing type text
    
    context.font = '400 18pt Roboto'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    
    const BalancingPrefixText = 'Balancing: '
    context.fillText(BalancingPrefixText, 10, 20 + titleTextHeight, width);
    
    let balancingTextWidth = context.measureText(BalancingPrefixText).width;
    let balancingTextHeight = context.measureText(BalancingPrefixText).height;
    context.font = '700 18pt Roboto'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    
    const BalancingTitleText = importedBuild["BalancingTitle"];
    context.fillText(BalancingTitleText, 10 + balancingTextWidth, 20 + titleTextHeight, width);
    
    // Generate date text
    
    context.font = '400 14pt Roboto'
    context.textAlign = 'right'
    context.textBaseline = 'top'
    
    let locationX = width - 10;
    // Get current date and time formatted as YYYY-MM-DD HH:MM:SS (24 hour) UTC
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    context.fillText(`Image Date: ${date} UTC`, locationX, 10, width);
    
    // Generate logo image

    const logoWidth = 82;
    const logoHeight = 82;

    let logoImagePromise = loadImage('./canvas-image-library/logo/Logo-Background.png').then(image => {
        // Image aspect ratio is 1:1
        context.drawImage(image, (width/2) - (logoWidth/2), 2, logoWidth, logoHeight);
    });
    promises.push(logoImagePromise);

    // Wait until the logo image is loaded before generating the rest of the image
    await logoImagePromise;

    // Generate link text
    
    context.font = '700 15pt Roboto'
    context.textAlign = 'center'
    context.textBaseline = 'center'
    
    const LinkText = 'balancedbydaylight.com';
    let linkMetrics = context.measureText(LinkText);
    let linkHeight = linkMetrics.actualBoundingBoxAscent + linkMetrics.actualBoundingBoxDescent;

    locationX = width / 2;
    context.fillText(LinkText, locationX, logoHeight - 2, width);

    // Generate Killer lore image
    let loreImagePromise = loadImage(importedBuild["KillerLoreImage"]).then(image => {
        // Image aspect ratio is 256:507
        context.globalAlpha = 0.8;
        context.drawImage(image, 0, height-(761/1.25), 384, 761);
        context.globalAlpha = 1;
        //console.log("Killer lore image loaded");
    });
    promises.push(loreImagePromise);

    // Wait until the lore image is loaded before generating the rest of the image
    await loreImagePromise;
    
    // Generate background for perks
    
    let BuildContainerWidth = 1000; //px
    let BuildContainerHeight = 600; //px
    let BuildContainerPadding = 5; //px
    let BuildContainerMargin = 10; //px
    let BuildContainerColor = '#25233380'; //hex + alpha
    
    let length = 4;
    
    let previousContainerHeight = 0;
    let previousContainerY = 0;
    let containerHeight = 138; // will do dynamic bullshit later maybe
    
    for (var i = 0; i < length; i++) {
        //console.log(`Build container ${i} generation...`);
        context.fillStyle = BuildContainerColor;
        let containerX = width - BuildContainerWidth - BuildContainerMargin;
        // Start at height - 600 - margin
        // Add former container height + padding + margin to get next container
        let containerY = 
        i == 0 ? 
        (height - BuildContainerHeight - BuildContainerMargin) : 
        (previousContainerY + previousContainerHeight + BuildContainerPadding + BuildContainerMargin);
    
        //console.log(`\t (${containerX}, ${containerY}) | ${BuildContainerWidth}x${containerHeight}`);
        context.fillRect(containerX, containerY, BuildContainerWidth, containerHeight);
    
        previousContainerHeight = containerHeight;
        previousContainerY = containerY;
    }
    
    // Generate perk images
    
    let PerkMargin = 10; //px
    let PerkGap = 10; //px
    let PerkSize = containerHeight - (PerkMargin * 2); //px
    let PerkOffset = 10; //px
    
    const originalLastX = width - BuildContainerWidth - BuildContainerMargin + PerkMargin + PerkOffset
    let lastX = originalLastX;
    previousContainerY = 0;
    
    length = 4;
    for (var containerIndex = 0; containerIndex < length; containerIndex++) {
    
        let containerY = 
        containerIndex == 0 ? 
        (height - BuildContainerHeight - BuildContainerMargin) : 
        (previousContainerY + previousContainerHeight + BuildContainerPadding + BuildContainerMargin);
    
    
        for (var i = 0; i < length; i++) {
            //console.log(`Perk ${i} generation...`);
    
            const currentContainerIndex = containerIndex;
            const currentIndex = i;
            const currentContainerY = containerY;
            const currentPerkIcon = importedBuild["SurvivorPerkIcons"][currentContainerIndex][currentIndex];
            //console.log(`\t${currentPerkIcon}`);

            promises.push(loadImage(currentPerkIcon).then(image => {
                context.drawImage(image,
                    originalLastX + (currentIndex * (PerkSize + PerkGap)),
                    currentContainerY + PerkMargin,
                    PerkSize, PerkSize);
                lastX += PerkSize + PerkGap;
                //console.log(`\tPerk (${currentContainerIndex}, ${currentIndex}) promise resolved!`);
            }))
            //console.log(`\tPerk ${i} loaded (Promise not resolved yet)`);
        }
    
        lastX = originalLastX;
        previousContainerY = containerY;
    }
    
    // Generate Offerings
    
    let OfferingOffset = 30; //px
    let OfferingMargin = 10; //px
    let OfferingSize = containerHeight - (OfferingMargin * 2); //px
    
    const OfferingStartX = lastX + (PerkSize + PerkGap) * 4 + OfferingOffset + OfferingMargin;
    
    for (var containerIndex = 0; containerIndex < length; containerIndex++) {
        //console.log(`Offering ${containerIndex} generation...`)
        let containerY = 
        containerIndex == 0 ? 
        (height - BuildContainerHeight - BuildContainerMargin) : 
        (previousContainerY + previousContainerHeight + BuildContainerPadding + BuildContainerMargin);
    
        const currentContainerIndex = containerIndex;
        const currentContainerY = containerY;
        const currentOfferingIcon = importedBuild["SurvivorOfferingIcons"][currentContainerIndex];
    
        promises.push(loadImage(currentOfferingIcon).then(image => {
            context.drawImage(image,
                OfferingStartX,
                currentContainerY + OfferingMargin,
                OfferingSize, OfferingSize);
            //console.log(`\tOffering ${currentContainerIndex} promise resolved!`);
        }))
    
        previousContainerY = containerY;
    
        //console.log(`\tOffering ${containerIndex} loaded (Promise not resolved yet)`);
    }
    
    // Generate Items
    
    let ItemOffset = 15; //px
    let ItemMargin = 25; //px
    let ItemSize = containerHeight - (ItemMargin * 2); //px
    
    const ItemStartX = OfferingStartX + OfferingSize + OfferingMargin + ItemOffset + ItemMargin;
    
    for (var containerIndex = 0; containerIndex < length; containerIndex++) {
    
        let containerY = 
        containerIndex == 0 ? 
        (height - BuildContainerHeight - BuildContainerMargin) : 
        (previousContainerY + previousContainerHeight + BuildContainerPadding + BuildContainerMargin);
    
        const currentContainerIndex = containerIndex;
        const currentContainerY = containerY;
        const currentItemIcon = importedBuild["SurvivorItemIcons"][currentContainerIndex];
    
        promises.push(loadImage(currentItemIcon).then(image => {
            context.drawImage(image,
                ItemStartX,
                currentContainerY + ItemMargin,
                ItemSize, ItemSize);
            //console.log(`\tItem ${currentContainerIndex} promise resolved!`);
        }));
    
        previousContainerY = containerY;
    
        //console.log(`\tItem ${containerIndex} loaded (Promise not resolved yet)`);
    }
    
    // Generate Addons
    
    let AddonOffset = -50; //px
    let AddonMarginX = 5; //px
    let AddonMarginY = 35; //px
    let AddonSize = containerHeight - (AddonMarginY * 2); //px
    
    const AddonStartX = ItemStartX + ItemSize + ItemMargin + AddonOffset + AddonMarginY;
    
    length = 4;
    let addonLength = 2;
    for (var containerIndex = 0; containerIndex < length; containerIndex++) {
    
        let containerY =
            containerIndex == 0 ?
                (height - BuildContainerHeight - BuildContainerMargin) :
                (previousContainerY + previousContainerHeight + BuildContainerPadding + BuildContainerMargin);
    
        for (var i = 0; i < addonLength; i++) {
            //console.log(`Addon ${i} generation...`);
    
            const currentContainerIndex = containerIndex;
            const currentIndex = i;
            const currentContainerY = containerY;
            const currentAddonIcon = importedBuild["SurvivorAddonIcons"][currentContainerIndex][currentIndex];
    
            promises.push(loadImage(currentAddonIcon).then(image => {
                context.drawImage(image,
                    AddonStartX + (currentIndex * (AddonSize + AddonMarginX)),
                    currentContainerY + AddonMarginY,
                    AddonSize, AddonSize);
                //console.log(`\tAddon (${currentContainerIndex}, ${currentIndex}) promise resolved!`);
            }))
            //console.log(`\tAddon ${i} loaded (Promise not resolved yet)`);
        }
    
        previousContainerY = containerY;
    }
    
    // Generates image only after all promises have been resolved
    Promise.allSettled(promises).then(() => {
        const buffer = canvas.toBuffer('image/png');
        callback({
            status: 200,
            imageData: buffer,
            message: "Image generated successfully!"
        })
    })
}

module.exports = {
    BeginGenerationImport: BeginGenerationImport,
    GenerateImage: GenerateImage
}