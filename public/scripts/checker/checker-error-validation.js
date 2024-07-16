/*
Name:
    checker-error-validation.js
Purpose:
    This file is designed for the purpose of handling all of the error checker functionality.

    Note that some of the error detection methods are located in the utilities file.

    Essentially, anything that directly interacts with the MasterErrorList belongs in this file.
*/

/**
 * Checks how many times a survivor perk is repeated across builds. If it is above the MaxPerkRepetition, an error is generated, added to the master list, and the individual error log is returned.
 * @returns {object} An object containing the error information if an error is found.
 */
function CheckForRepetition(builds) {
    var ErrorLog = [];

    //DebugLog(builds);

    // Loop through builds
    for (var i = 0; i < builds.length; i++) {
        let currentBuild = builds[i];
        
        if (currentBuild == undefined) { continue; }

        // Loop through perks in build
        for (var j = 0; j < currentBuild.length; j++) {
            let currentPerk = currentBuild[j];

            if (currentPerk == undefined) { continue; }

            var perkRepeatAmount = 0;

            // Loop through other builds
            for (var k = i+1; k < builds.length; k++) {

                let otherBuild = builds[k];

                if (otherBuild == undefined) { continue; }

                var perkRepeated = BuildHasPerk(currentPerk["id"], otherBuild);
                DebugLog(`Checking if ${currentPerk["name"]} is repeated in build ${k} (on build ${i})`);

                if (perkRepeated) {
                    perkRepeatAmount++;
                }

                DebugLog(`Perk repeat amount: ${perkRepeatAmount}`);
                DebugLog(perkRepeated);
                DebugLog(currentBalancing.MaxPerkRepetition)
                if (perkRepeatAmount >= currentBalancing.MaxPerkRepetition) {
                    ErrorLog.push(GenerateErrorObject(
                        "Perk Repetition",
                        `Perk <b>${currentPerk["name"]}</b> is repeated more than ${currentBalancing.MaxPerkRepetition} ${currentBalancing.MaxPerkRepetition > 1 ? "times" : "time"} in Survivor builds.`,
                        undefined,
                        "iconography/PerkError.webp"
                    ))
                }
            }
        }
    }

    // Remove duplicates from ErrorLog
    ErrorLog = ErrorLog.filter(
        (currentErr, index, errLog) => 
            errLog.findIndex(
                comparisonErr => (comparisonErr.REASON === currentErr.REASON)
            ) === index
    );

    for (var i = 0; i < ErrorLog.length; i++) {
        MasterErrorList.push(ErrorLog[i]);
    }

    return ErrorLog;
}

/**
 * A function to check if the current build contains a duplicate perk.
 * @param {object} build The build to check for duplicates.
 */
function CheckForDuplicates(survIndex, build) {
    var ErrorLog = [];

    //DebugLog(build);

    for (var i = 0; i < build.length; i++) {
        let currentPerk = build[i];

        if (currentPerk == undefined) { continue; }

        for (var j = i+1; j < build.length; j++) {
            let otherPerk = build[j];

            if (otherPerk == undefined) { continue; }

            DebugLog(`Comparing ${currentPerk["name"]} to ${otherPerk["name"]}`);
            if (currentPerk["id"] == otherPerk["id"]) {
                if (selectedRole == 0) {
                    ErrorLog.push(
                        GenerateErrorObject(
                            "Duplicate Perk",
                            `Perk <b>${currentPerk["name"]}</b> is duplicated in <b>Survivor #${survIndex+1}</b>'s build.`,
                            undefined,
                            "iconography/PerkError.webp",
                            true
                        )
                    )
                } else {
                    ErrorLog.push(
                        GenerateErrorObject(
                            "Duplicate Perk",
                            `Perk <b>${currentPerk["name"]}</b> is duplicated in the Killer's build.`,
                            undefined,
                            "iconography/PerkError.webp",
                            true
                        )
                    )
                }
            }
        }
    }

    for (var i = 0; i < ErrorLog.length; i++) {
        MasterErrorList.push(ErrorLog[i]);
    }

    return ErrorLog;
}

/**
 * A function to check if the current build contains a banned perk.
 * @param {object} build The build to check for banned perks. 
 * @returns {object} An object containing the error information if an error is found.
 */
function CheckForBannedIndividualPerk(build, survivorIndex) {
    var currentOverride = currentBalancing.KillerOverride[selectedKiller];
    //DebugLog(currentOverride);

    var ErrorLog = [];

    // DebugLog("Getting new log (Individual)...");
    var newLog = IndividualIsBannedInOverride(build, currentOverride, survivorIndex);
    
    try {
        for (var i = 0; i < newLog.length; i++) {
            ErrorLog.push(newLog[i]);
        }
    } catch (error) {
        GenerateAlertModal("Error", "An error occurred while checking for banned perks.<br>" + 
        "It's possible that this character is no longer in the Killer Override balancing list.<br>" +
        "Please select a different killer or change the balancing."); 
    }

    for (var i = 0; i < ErrorLog.length; i++) {
        MasterErrorList.push(ErrorLog[i]);
    }
    return ErrorLog;
}

/**
 * Checks if the current build contains a banned set of combo perks. If so, an error is generated, added to the master list, and the individual error log is returned.
 * @param {Array} build 
 * @param {Number} survivorIndex 
 */
function CheckForBannedComboPerks(build, survivorIndex) {
    DebugLog("Checking for banned combo perks...");
    var currentOverride = currentBalancing.KillerOverride[selectedKiller];

    var ErrorLog = [];

    DebugLog("Getting new log (Combo)...");
    var newLog = ComboIsBannedInOverride(build, currentOverride, survivorIndex);

    for (var i = 0; i < newLog.length; i++) {
        ErrorLog.push(newLog[i]);
    }

    for (var i = 0; i < ErrorLog.length; i++) {
        MasterErrorList.push(ErrorLog[i]);
    }
}

/**
 * Is responsible for detecting all balancing errors for survivor builds.
 * 
 * It begins by checking perk repetition, then checks for duplicates. Afterwards, it checks for individual bans and then combo bans.
 * 
 * Once this is done, it applies the banned-offering property to any banned offerings applied and does the same for items and add-ons.
 */
function CheckForSurvivorBalanceErrors() {
    MasterErrorList = [];

    // Check for repetition
    CheckForRepetition(SurvivorPerks);

    // Check for duplicates
    for (var i = 0; i < SurvivorPerks.length; i++) {
        CheckForDuplicates(i, SurvivorPerks[i]);
    }

    // Check for banned perks
    for (var i = 0; i < SurvivorPerks.length; i++) {
        // DebugLog(`Checking for individual perk bans on build #${i}...`);
        CheckForBannedIndividualPerk(SurvivorPerks[i], i);

        DebugLog(`Checking for combo perk bans on build #${i}...`);
        CheckForBannedComboPerks(SurvivorPerks[i], i);
    }

    var currentOverride = currentBalancing.KillerOverride[selectedKiller];
    DebugLog("Current Override:");
    DebugLog(currentOverride);

    // Reset banned offerings
    let offerings = document.getElementsByClassName("offering-slot");
    for (var offering of offerings) {
        offering.classList.remove("banned-offering");
    }

    // Check for banned offerings
    for (var i = 0; i < SurvivorOfferings.length; i++) {
        let bannedOfferings = GetBannedOfferings();

        if (SurvivorOfferings[i] == undefined) { continue; }
        if (bannedOfferings["Survivor"].includes(SurvivorOfferings[i]["id"])) {
            
            let offerings = document.getElementsByClassName("offering-slot");
            offerings[i].classList.add("banned-offering");

            MasterErrorList.push(
                GenerateErrorObject(
                    "Banned Offering",
                    `Offering <b>${SurvivorOfferings[i]["name"]}</b> is banned against <b>${currentOverride["Name"]}</b>. It is present in <b>Survivor #${i+1}</b>'s build.`,
                    undefined,
                    "iconography/OfferingError.webp"
                )
            );
        }
    }

    // Reset banned items
    let items = document.getElementsByClassName("item-slot");
    for (var item of items) {
        item.classList.remove("banned-item");
    }

    // Check for banned items
    for (var i = 0; i < SurvivorItems.length; i++) {
        let bannedItems = GetBannedItems();

        if (SurvivorItems[i] == undefined) { continue; }
        if (bannedItems.includes(SurvivorItems[i]["id"])) {
            let items = document.getElementsByClassName("item-slot");
            items[i].classList.add("banned-item");

            MasterErrorList.push(
                GenerateErrorObject(
                    "Banned Item",
                    `Item <b>${SurvivorItems[i]["Name"]}</b> is banned against <b>${currentOverride["Name"]}</b>. It is present in <b>Survivor #${i+1}</b>'s build.`,
                    undefined,
                    "iconography/ItemError.webp"
                )
            );
        }
    }

    // Reset banned addons
    let addons = document.getElementsByClassName("addon-slot");
    for (var addon of addons) {
        addon.classList.remove("banned-addon");
        addon.classList.remove("duplicate-addon");
    }

    // Check for banned addons
    for (var i = 0; i < SurvivorItems.length; i++) {
        DebugLog(`Checking for banned addons on Survivor #${i}...`)
        let currentItem = SurvivorItems[i];

        if (currentItem == undefined) { 
            continue; 
        }
        if (currentItem["Type"] == undefined) { 
            continue; 
        }

        const itemType = currentItem["Type"];
        const bannedAddons = GetBannedAddons(itemType);

        if (bannedAddons == undefined) {
            continue;
        }

        addonIDs = [];
        for (var j = 0; j < SurvivorAddons[i].length; j++) {
            DebugLog(`\tChecking for banned addons on Survivor #${i} at addon slot #${j}...`)
            let currentAddon = SurvivorAddons[i][j];

            if (currentAddon == undefined) {
                continue;
            }

            addonIDs.push(currentAddon);
            DebugLog(`\t\tPushed ${currentAddon["Name"]} to addonIDs.`);
            if (bannedAddons.includes(currentAddon["id"])) {
                let addons = document.getElementsByClassName("addon-slot");
                for (var addon of addons) {
                    if (addon.dataset.survivorID == i && addon.dataset.addonSlot == j) {
                        addon.classList.add("banned-addon");
                    }
                }

                MasterErrorList.push(
                    GenerateErrorObject(
                        "Banned Addon",
                        `Addon <b>${currentAddon["Name"]}</b> is banned against <b>${currentOverride["Name"]}</b>. It is present in <b>Survivor #${i+1}</b>'s build at <b>Addon Slot #${j+1}</b>.`,
                        undefined,
                        "iconography/AddonError.webp"
                    )
                );
            }   
        }

        DebugLog(`\tFinal addonIDs:`);
        DebugLog(addonIDs);

        // Check if every size-two addon permutation is a duplicate or not
        for (var j = 0; j < addonIDs.length; j++) {
            for (var k = j+1; k < addonIDs.length; k++) {
                DebugLog(`\t\tChecking if ${addonIDs[j]["Name"]} is a duplicate of ${addonIDs[k]["Name"]}...`)
                let currentAddonID = addonIDs[j]["id"];
                let otherAddonID = addonIDs[k]["id"];

                if (currentAddonID == undefined || otherAddonID == undefined) { continue; }

                if (currentAddonID == otherAddonID) {
                    DebugLog('\t\t\t<b>Duplicate detected!</b>')

                    let addons = document.getElementsByClassName("addon-slot");
                    for (var addon of addons) {
                        if (addon.dataset.survivorID == i && addon.dataset.addonSlot == j) {
                            addon.classList.add("duplicate-addon");
                        }
                        if (addon.dataset.survivorID == i && addon.dataset.addonSlot == k) {
                            addon.classList.add("duplicate-addon");
                        }
                    }

                    MasterErrorList.push(
                        GenerateErrorObject(
                            "Duplicate Addon",
                            `Addon <b>${addonIDs[j]["Name"]}</b> is duplicated in <b>Survivor #${i+1}</b>'s build.`,
                            undefined,
                            "iconography/AddonError.webp",
                            true
                        )
                    );
                    DebugLog('\t\t\t<b>Pushed error to MasterErrorList!</b>')
                }
            }
        }
    }

    UpdateErrorUI();
}

/**
 * Is responsible for detecting all balancing errors for the killer build.
 * 
 * It begins by checking for duplicates, and then checks for banned individual and combined perks.
 * 
 * Similar to the survivor counterpart, it applies the banned-offering property to any banned offerings applied and does the same for add-ons.
 */
function CheckForKillerBalanceErrors() {
    MasterErrorList = [];

    // Check for duplicates
    CheckForDuplicates(-1, KillerPerks);

    // Check for banned perks
    CheckForBannedIndividualPerk(KillerPerks, -1);

    // Check for banned combo perks
    CheckForBannedComboPerks(KillerPerks, -1);

    // Reset banned offerings
    let offerings = document.getElementsByClassName("offering-slot");
    for (var offering of offerings) {
        offering.classList.remove("banned-offering");
    }

    // Check for banned offerings
    let bannedOfferings = GetBannedOfferings();

    let passesGuardClause = true;

    if (KillerOffering == undefined) { passesGuardClause = false; }
    if (bannedOfferings == undefined) { passesGuardClause = false; }

    if (passesGuardClause) {
        if (bannedOfferings["Killer"].includes(KillerOffering["id"])) {
            let offeringElement = document.getElementById("killer-offering-slot");

            offeringElement.classList.add("banned-offering");

            MasterErrorList.push(
                GenerateErrorObject(
                    "Banned Offering",
                    `Offering <b>${KillerOffering["name"]}</b> is banned when playing as <b>${currentBalancing.KillerOverride[selectedKiller]["Name"]}</b>.`,
                    undefined,
                    "iconography/OfferingError.webp"
                )
            );
        } 
    }

    // Check for banned addons
    DebugLog("CHECKING FOR BANNED ADDONS!!!")
    let bannedKlrAddons = GetBannedKillerAddons();

    
    passesGuardClause = true;

    
    if (bannedKlrAddons == undefined) { passesGuardClause = false; }
    
    if (passesGuardClause) {
        DebugLog("PASSED GUARD CLAUSE!!!")
        if (!AreKillerAddonsValid()) {
            MasterErrorList.push(
                GenerateErrorObject(
                    "Invalid Addon Mix",
                    `The current addon selection is invalid for <b>${currentBalancing.KillerOverride[selectedKiller]["Name"]}</b>.`,
                    undefined,
                    "iconography/AddonError.webp",
                    true
                )
            );
        }
        
        for (var i = 0; i < KillerAddons.length; i++) {
            let currentAddon = KillerAddons[i];
            DebugLog(`Checking for banned addons on addon slot #${i}...`)
            DebugLog(currentAddon);

            if (currentAddon == undefined) { continue; }

            DebugLog(`Current addon is not undefined!`)

            let foundBannedMatch = false;
            for (var j = 0; j < bannedKlrAddons.length; j++) {
                let currentBannedAddon = bannedKlrAddons[j];

                if (currentBannedAddon == undefined) { continue; }

                DebugLog(`Checking if ${currentAddon["id"]} is banned...`)

                if (currentAddon["globalID"] == currentBannedAddon["globalID"]) {
                    foundBannedMatch = true;
                }
            }

            if (foundBannedMatch) {
                DebugLog(`Banned addon detected!`)
                let addonElements = document.getElementsByClassName("killer-addon-slot");

                let targetElement = undefined;

                for (var j = 0; j < addonElements.length; j++) {
                    let currentElement = addonElements[j];

                    if (currentElement.dataset.addonSlot == i) {
                        targetElement = currentElement;
                        break;
                    }
                }
                if (targetElement == undefined) { continue; }

                targetElement.classList.add("banned-addon");

                MasterErrorList.push(
                    GenerateErrorObject(
                        "Banned Addon",
                        `Addon <b>${currentAddon["Name"]}</b> is banned when playing as <b>${currentBalancing.KillerOverride[selectedKiller]["Name"]}</b>.`,
                        undefined,
                        "iconography/AddonError.webp"
                    )
                );
            }
        }
    }

    // Check for duplicate addons
    if (KillerAddons.length == 2) {
        let passesDupeGuardClause = true;

        if (KillerAddons[0] == undefined || KillerAddons[1] == undefined) { passesDupeGuardClause = false; }
        
        if (passesDupeGuardClause) {
            if (KillerAddons[0]["globalID"] == KillerAddons[1]["globalID"]) {
                let addonElements = document.getElementsByClassName("killer-addon-slot");

                for (var i = 0; i < addonElements.length; i++) {
                    let currentElement = addonElements[i];
                    currentElement.classList.add("banned-addon");
                }

                MasterErrorList.push(
                    GenerateErrorObject(
                        "Duplicate Addon",
                        `Addon <b>${KillerAddons[0]["Name"]}</b> is duplicated in the Killer's build.`,
                        undefined,
                        "iconography/AddonError.webp",
                        true
                    )
                );
            }
        }
    }

    UpdateErrorUI();
}