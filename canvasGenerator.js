const fs = require('fs')
const pako = require('pako')
const { createCanvas, loadImage } = require('canvas')

const Killers = require('./public/Killers.json');
const Perks = require('./public/Perks/dbdperks.json');
const Items = require('./public/Items.json');
const Offerings = require('./public/Offerings.json');
const KillerAddons = require('./public/NewAddons.json');

function GetKillerAddonById(id) {
    for (let i = 0; i < KillerAddons.length; i++) {
        let currentKiller = KillerAddons[i];

        for (let j = 0; j < currentKiller["Addons"].length; j++) {
            let currentAddon = currentKiller["Addons"][j];

            if (currentAddon["globalID"] == id) {
                return currentAddon;
            }
        }
    }

    return undefined;
}

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
            message: "Invalid build data. Could not decrypt and decompress."
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

    //console.log(importedBuild);

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
        SurvivorAddonIcons: [[], [], [], []],
        KillerPerkIcons: [],
        KillerAddonIcons: [],
        KillerOfferingIcon: "",
        KillerPowerIcon: "",
        NumErrors: 0,
        AntiFacecampPermitted: false
    }

    try {
        // Get Killer Name
        exampleImageGenObject.KillerName = Killers[importedBuild.selectedKiller].Name;
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: `Invalid build data. Could not find killer name.`
        })
        return;
    }

    try {
        // Get Anti-Facecamp settings
        let antiFacecampAllowed = importedBuild["AntiFacecampPermitted"];
        exampleImageGenObject.AntiFacecampPermitted = antiFacecampAllowed;
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Anti-Facecamp Data not present. "
        })
        return;
    }

    try {
        // Get Number of Errors

        if (importedBuild.numErrors != undefined) {
            exampleImageGenObject.NumErrors = importedBuild.numErrors;
        } else {
            exampleImageGenObject.NumErrors = 0;
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not find number of errors."
        })
        return;
    }

    try {
        // Get Killer Lore Image
        // First get the killer's name without spaces and omit "The"
        let killerName = Killers[importedBuild.selectedKiller].Name.replace("The", "");
        killerName = killerName.replace(/\s/g, "");

        // Then get the lore image
        exampleImageGenObject.KillerLoreImage = `./canvas-image-library/lore/${killerName}.png`;
    
        // Check if the image exists
        if (!fs.existsSync(exampleImageGenObject.KillerLoreImage)) {
            throw `Image does not exist at path ${exampleImageGenObject.KillerLoreImage}`;
        }
    
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: `Invalid build data. Could not find killer lore image.\n${err}`
        })
        return;
    }

    try {
        // Get Balancing Title
        if (importedBuild.customBalanceOverride) {
            let truncatedTitle = importedBuild.currentBalancing["Name"].substring(0, 18);
            if (truncatedTitle.length < importedBuild.currentBalancing["Name"].length) {
                truncatedTitle += "...";
            }
            exampleImageGenObject.BalancingTitle = `${truncatedTitle} (Custom)`;
        } else {
            const Balancings = JSON.parse(
                fs.readFileSync('./public/Balancings.json',
                { encoding: 'utf8', flag: 'r' })
            );

            exampleImageGenObject.BalancingTitle = `Unknown (ID=${importedBuild.currentBalancingIndex})`;

            for (var balance of Balancings) {
                if (balance["ID"] == importedBuild.currentBalancingIndex) {
                    exampleImageGenObject.BalancingTitle = balance["Name"];
                    break;
                }
            }
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
                            throw `Perk at path ${endIconPath} does not exist!`
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
                        throw `Offering at path ${endIconPath} does not exist!`
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
                        throw `Item at path ${endIconPath} does not exist!`;
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

    try {
        // Get Killer Perk Icons

        for (var i = 0; i < importedBuild.killerPerksId.length; i++) {
            let desiredID = importedBuild.killerPerksId[i];

            // If the perk is null, push a blank image
            if (desiredID == null) {
                exampleImageGenObject.KillerPerkIcons.push('./canvas-image-library/Perks/blank.png');
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
                    endIconPath = `./canvas-image-library/Perks/Killers/${perkName}`;

                    // Change .webp to .png
                    endIconPath = endIconPath.replace(".webp", ".png");

                    // Check if the image exists
                    if (!fs.existsSync(endIconPath)) {
                        throw "Image does not exist!";
                    }

                    exampleImageGenObject.KillerPerkIcons.push(endIconPath);
                    break;
                }
            }
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Killer Perk icons."
        });
        return;
    }

    try {
        // Get Killer Power Image
        // First get the killer's name without spaces and omit "The"
        let killerName = Killers[importedBuild.selectedKiller].Name.replace("The", "");

        // Remove all spaces
        killerName = killerName.replace(/\s/g, "");

        // Then get the power image
        exampleImageGenObject.KillerPowerIcon = `./canvas-image-library/Powers/${killerName}.png`;
    
        // Check if the image exists
        if (!fs.existsSync(exampleImageGenObject.KillerPowerIcon)) {
            throw `Image does not exist at path ${exampleImageGenObject.KillerLoreImage}`;
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Killer Power icon."
        });
        return;
    }

    try {
        // Get Killer Offering Icon
        let desiredID = importedBuild.killerOfferingId;

        // If the offering is null, push a blank image
        if (desiredID == null) {
            exampleImageGenObject.KillerOfferingIcon = './canvas-image-library/Offerings/blank.png';
        } else {
            // Get the offering icon
            for (const offering of Offerings["Killer"]) {
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

                    exampleImageGenObject.KillerOfferingIcon = endIconPath;
                    break;
                }
            }
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Killer Offering icon."
        });
        return;
    }

    try {
        // Get Killer Addon Icons

        if (importedBuild.killerAddonsId.length != 2) {
            throw "Invalid number of killer addons!";
        }

        for (var i = 0; i < importedBuild.killerAddonsId.length; i++) {

            // First get the killer's name without spaces and omit "The"
            let killerName = Killers[importedBuild.selectedKiller].Name.replace("The", "");

            // Remove all spaces
            killerName = killerName.replace(/\s/g, "");

            //console.log(`Killer Name: ${killerName}`)

            let desiredID = importedBuild.killerAddonsId[i];

            //console.log("Desired ID: " + desiredID)

            let currentAddon = GetKillerAddonById(desiredID);

            //console.log(`Current Addon ${currentAddon}`);

            if (currentAddon == undefined) {
                //console.log ("Blank addon!");
                exampleImageGenObject.KillerAddonIcons.push('./canvas-image-library/Addons/blank.png');
                continue;
            }

            //console.log("Passed undefined check");

            let endIconPath = "";

            // Get the name of the addon without file path
            let addonName = currentAddon["addonIcon"].split("/").pop();

            // Append the canvas-image-library path to the start
            endIconPath = `./canvas-image-library/PowerAddons/${killerName}/${addonName}`;

            // Change .webp to .png
            endIconPath = endIconPath.replace(".webp", ".png");

            //console.log("End Icon Path: " + endIconPath)

            // Check if the image exists
            if (!fs.existsSync(endIconPath)) {
                throw "Image does not exist!";
            }

            exampleImageGenObject.KillerAddonIcons.push(endIconPath);
        }
    } catch(err) {
        callback({
            status: 400,
            imageData: null,
            message: "Invalid build data. Could not get Killer Addon icons."
        });
        return;
    }

    //console.log("PASSED OBJECT:");
    //console.log(exampleImageGenObject);

    GenerateImage(exampleImageGenObject, callback, importedBuild.selectedRole);
}

function GenerateImage(importedBuild, callback, role) {
    switch (role) {
        case 0: // Survivor
            GenerateSurvivorImage(importedBuild, callback);
            break;
        case 1: // Killer
            GenerateKillerImage(importedBuild, callback);
            break;
    }
}

async function GenerateSurvivorImage(importedBuild, callback) {
    //console.log("GENERATE SURVIVOR IMAGE");

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

    // Generate Anti-Facecamp Badge

    const badgeSize = 38;
    const badgePath = importedBuild["AntiFacecampPermitted"] ? './canvas-image-library/icons/Anticamp-Permitted.png' : './canvas-image-library/icons/Anticamp-Prohibited.png';
    let badgeXPos = 10 + titleTextWidth + context.measureText(KillerTitleText).width + 10;

    let badgeImagePromise = loadImage(badgePath).then(image => {
        // Image aspect ratio is 1:1
        context.drawImage(image, badgeXPos, 10, badgeSize, badgeSize);
    });
    promises.push(badgeImagePromise);
    
    await badgeImagePromise;
    
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
    
    context.font = '700 14pt Roboto'
    context.textAlign = 'right'
    context.textBaseline = 'top'

    
    let locationX = width - 10;
    // Get current date and time formatted as YYYY-MM-DD HH:MM:SS (24 hour) UTC
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let dateText = `Image Date: ${date} UTC`;
    context.fillText(dateText, locationX, 10, width);

    let dateTextHeight = context.measureText(dateText).height;

    // Generate numError text

    context.font = '700 14pt Roboto'
    context.textAlign = 'right'
    context.textBaseline = 'top'

    let numErrors = importedBuild["NumErrors"];
    
    let numErrorsText = numErrors == 0 ?
                            "Build valid at time of image generation" :
                                numErrors == 1 ?
                                    "1 error found at image generation" :
                                    `${numErrors} errors found at image generation`;

    const errorColor = numErrors == 0 ? '#80ff80' : '#ff8080';
    context.fillStyle = errorColor;

    context.fillText(numErrorsText, locationX, 40, width);

    context.fillStyle = '#fff';
    
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

async function GenerateKillerImage(importedBuild, callback) {
    //console.log("GENERATE KILLER IMAGE");

    // Tracks all promises to be resolved before writing to file
    let promises = [];

    const width = 1080
    const height = 600

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#100f16'
    context.fillRect(0, 0, width, height)

    // Generate Killer lore image
    
    let loreImagePromise = loadImage(importedBuild["KillerLoreImage"]).then(image => {
        // Image aspect ratio is 256:507
        context.globalAlpha = 0.8;
        context.drawImage(image, 0, height-(761/1.34), 384, 761);
        context.globalAlpha = 1;
        //console.log("Killer lore image loaded");
    });

    promises.push(loreImagePromise);

    // Wait until the lore image is loaded before generating the rest of the image
    await loreImagePromise;

    // Generate Killer playing as text

    context.font = '400 24pt Roboto'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    const TitlePrefixText = 'Playing as: '
    
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

    // Generate Anti-Facecamp Badge

    const badgeSize = 38;
    const badgePath = importedBuild["AntiFacecampPermitted"] ? './canvas-image-library/icons/Anticamp-Permitted.png' : './canvas-image-library/icons/Anticamp-Prohibited.png';
    let badgeXPos = 10 + titleTextWidth + context.measureText(KillerTitleText).width + 10;

    let badgeImagePromise = loadImage(badgePath).then(image => {
        // Image aspect ratio is 1:1
        context.drawImage(image, badgeXPos, 10, badgeSize, badgeSize);
    });
    promises.push(badgeImagePromise);
    
    await badgeImagePromise;

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
    
    context.font = '700 14pt Roboto'
    context.textAlign = 'right'
    context.textBaseline = 'top'
    
    let locationX = width - 10;
    // Get current date and time formatted as YYYY-MM-DD HH:MM:SS (24 hour) UTC
    const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    context.fillText(`Image Date: ${date} UTC`, locationX, 10, width);

    // Generate numError text

    context.font = '700 14pt Roboto'
    context.textAlign = 'right'
    context.textBaseline = 'top'

    let numErrors = importedBuild["NumErrors"];
    
    let numErrorsText = numErrors == 0 ?
                            "Build valid at time of image generation" :
                                numErrors == 1 ?
                                    "1 error found at image generation" :
                                    `${numErrors} errors found at image generation`;

    const errorColor = numErrors == 0 ? '#80ff80' : '#ff8080';
    context.fillStyle = errorColor;

    context.fillText(numErrorsText, locationX, 40, width);

    context.fillStyle = '#fff';
    
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

    // Generate background for perks

    let BuildContainerWidth = 440; //px
    let BuildContainerHeight = 440; //px
    let BuildContainerPadding = 5; //px
    let BuildContainerMargin = 20; //px
    let BuildContainerRightMargin = 350; //px
    let BuildContainerColor = '#25233380'; //hex + alpha

    context.fillStyle = BuildContainerColor;
    let containerX = width - BuildContainerWidth - BuildContainerRightMargin;
    let containerY = height - BuildContainerHeight - BuildContainerMargin;

    context.fillRect(containerX, containerY, BuildContainerWidth, BuildContainerHeight);

    // Generate perk images

    let PerkImageSize = 196; //px
    let PerkMargin = 10; //px
    let PerkLROffset = PerkImageSize / 2; //px

    let perkLength = 4;

    for (var i = 0; i < perkLength; i++) {
        let isCenter = i % 2 == 0; // 0 & 1 = CenterX
        let isLeft = i > 2; // 1 = Right | 3 = Left
        let isTop = i < 2; // 0 = Top | 1 = Bottom

        let currentPerkIcon = importedBuild["KillerPerkIcons"][i];
        
        let containerXCenter = containerX + (BuildContainerWidth / 2);
        let containerYCenter = containerY + (BuildContainerHeight / 2);

        let currentX;

        if (isCenter) {
            currentX = containerXCenter - (PerkImageSize / 2) + (PerkMargin / 2);
        } else {
            if (isLeft) {
                currentX = containerXCenter - PerkLROffset - PerkMargin - (PerkImageSize/2);
            } else {
                currentX = containerXCenter + PerkLROffset + PerkMargin - (PerkImageSize/2);
            }
        }

        let currentY;

        if (isCenter) {
            if (isTop) {
                currentY = containerYCenter - PerkImageSize - PerkMargin;
            } else {
                currentY = containerYCenter + PerkMargin;
            }
        } else {
            currentY = containerYCenter - (PerkImageSize / 2);
        }

        promises.push(loadImage(currentPerkIcon).then(image => {
            context.drawImage(image, currentX, currentY, PerkImageSize, PerkImageSize);
        }));
    }
    
    // Generate background for power + addons

    let PowerContainerWidth = 310; //px
    let PowerContainerHeight = 210; //px

    let PowerContainerMargin = 20; //px

    let PowerContainerColor = '#25233380'; //hex + alpha

    context.fillStyle = PowerContainerColor;
    let powerContainerX = width - PowerContainerWidth - PowerContainerMargin;
    let powerContainerY = height - PowerContainerHeight - PowerContainerMargin;

    let powerContainerCenterY = powerContainerY + (PowerContainerHeight / 2);

    context.fillRect(powerContainerX, powerContainerY, PowerContainerWidth, PowerContainerHeight);

    // Generate Killer Power Image

    let PowerImageMargin = 15; //px
    let PowerImageWidth = PowerContainerHeight - 20;
    
    let PowerImageX = powerContainerX + PowerImageMargin;
    let PowerImageY = powerContainerCenterY - (PowerImageWidth / 2);

    let killerPowerImagePromise = loadImage(importedBuild["KillerPowerIcon"]).then(image => {
        context.drawImage(image, PowerImageX, PowerImageY, PowerImageWidth, PowerImageWidth);
    });

    promises.push(killerPowerImagePromise);

    await killerPowerImagePromise;

    // Generate Killer Addon Images

    let AddonImageWidthMargin = 20; //px
    let AddonImageHeightMargin = 5; //px
    
    let AddonImageSize = (PowerImageWidth / 2) - AddonImageHeightMargin; //px


    let AddonImageX = powerContainerX + PowerContainerWidth - AddonImageSize - AddonImageWidthMargin;
    let AddonImageY = powerContainerCenterY - AddonImageSize - AddonImageHeightMargin/2;

    let addonImagePromise = loadImage(importedBuild["KillerAddonIcons"][0]).then(image => {
        context.drawImage(image, AddonImageX, AddonImageY, AddonImageSize, AddonImageSize);
    });

    promises.push(addonImagePromise);

    await addonImagePromise;

    AddonImageY = powerContainerCenterY + AddonImageHeightMargin/2;

    let addonImagePromiseB = loadImage(importedBuild["KillerAddonIcons"][1]).then(image => {
        context.drawImage(image, AddonImageX, AddonImageY, AddonImageSize, AddonImageSize);
    });

    promises.push(addonImagePromiseB);

    await addonImagePromiseB;

    // Generate background for offering

    let OfferingContainerWidth = 310; //px
    let OfferingContainerHeight = 210; //px
    let OfferingContainerMargin = 20; //px
    let OfferingContainerBottomMargin = 20; //px
    let OfferingContainerColor = '#25233380'; //hex + alpha

    context.fillStyle = OfferingContainerColor;
    let offeringContainerX = width - OfferingContainerWidth - OfferingContainerMargin;
    let offeringContainerY = height - OfferingContainerHeight - OfferingContainerBottomMargin - PowerContainerHeight - PowerContainerMargin;

    let offeringContainerCenterX = offeringContainerX + (OfferingContainerWidth / 2);
    let offeringContainerCenterY = offeringContainerY + (OfferingContainerHeight / 2);

    context.fillRect(offeringContainerX, offeringContainerY, OfferingContainerWidth, OfferingContainerHeight);

    // Generate Killer Offering Image

    let OfferingImageSize = OfferingContainerHeight - OfferingContainerMargin;
    let OfferingImageX = offeringContainerCenterX - (OfferingImageSize / 2);
    let OfferingImageY = offeringContainerCenterY - (OfferingImageSize / 2);

    let killerOfferingImagePromise = loadImage(importedBuild["KillerOfferingIcon"]).then(image => {
        context.drawImage(image, OfferingImageX, OfferingImageY, OfferingImageSize, OfferingImageSize);
    });

    promises.push(killerOfferingImagePromise);

    await killerOfferingImagePromise;

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