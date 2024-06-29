/*
Name:
    checker-utility.js
Purpose:
    This file hosts all of the categorized utility methods for the balance checker.
    For more information on the categories, please see the method mapper.
*/

/**
 * Generates and returns a list of all banned add-ons as the selected killer.
 * @returns {Array} The list of all banned killer add-ons. These are individual add-on objects, not just their IDs.
 */
function GetBannedKillerAddons() {
    DebugLog("GetBannedKillerAddons():");

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (KillerAddonsList == undefined) { return null; }

    let bannedAddons = new Array()

    let currentKillerName = Killers[selectedKiller];

    let curKLRAddonsList = undefined;

    for (let i = 0; i < KillerAddonsList.length; i++) {
        let currentKiller = KillerAddonsList[i];

        //console.log(`currentKiller: ${currentKiller["Name"]}`);
        
        if (currentKiller["Name"] == currentKillerName) {
            curKLRAddonsList = currentKiller["Addons"];
            break;
        }
        // if (killer == currentKillerName) {
        //     curKLRAddonsList = KillerAddonsList[killer];
        // }
    }

    //console.log(`curKLRAddonsList:`);

    if (curKLRAddonsList == undefined) { return null; }

    // Get banned addon tiers from killer override
    let bannedAddonTiers = currentBalancing.KillerOverride[selectedKiller]["AddonTiersBanned"];

    for (const curAddon of curKLRAddonsList) {
        //console.log(curAddon);
        let addonID = curAddon["globalID"];

        if (curAddon == undefined) { continue; }

        //console.log(`curAddon: ${curAddon["Name"]}`);

        let curRarity = curAddon["Rarity"];

        if (bannedAddonTiers.includes(curRarity)) {
            bannedAddons.push(curAddon);
            continue;
        }

        // Get banned addons from killer override
        let bannedAddonsList = currentBalancing.KillerOverride[selectedKiller]["IndividualAddonBans"];

        if (bannedAddonsList.includes(addonID) || bannedAddonsList.includes(curAddon["Name"])) {
            bannedAddons.push(curAddon);
        }
    }

    return bannedAddons;
}

/**
 * Generates and returns a list of all banned add-ons of a specified item type against the selected killer.
 * @param {String} itemType The item type to gather the add-on data from.
 * @returns {Array} The banned list of add-ons. This is an array of IDs, not objects.
 */
function GetBannedAddons(itemType) {
    DebugLog("Is current balancing set?");
    DebugLog(currentBalancing);

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (Items == undefined) { return null; }

    let bannedAddons = new Array()

    // Get addons from killer override
    let whitelistedAddons = currentBalancing.KillerOverride[selectedKiller].AddonWhitelist[itemType]["Addons"];
    let addonList = Items["ItemTypes"][GetIndexOfItemType(itemType)]["Addons"];

    //console.log(whitelistedAddons);
    for (const addon of addonList) {
        // If the addon is not in the addons, add it to the banned addons
        if (!whitelistedAddons.includes(addon.id)) {
            bannedAddons.push(addon.id);
        }
    }

    return bannedAddons;
}

/**
 * Responsible for setting the custom balancing override based on the value of the custom balance input box in the settings menu.
 * @returns {Objec} The custom balance preset object.
 */
function GetCustomBalancing() {
    var customBalanceInput = document.getElementById("custom-balance-select");
    var customBalanceLabel = document.getElementById("balance-mode-label");
    var customBalanceDropdown = document.getElementById("balancing-select");

    var balanceTypeBox = document.getElementById("balance-type-box");

    var customBalanceObj = {};
    
    // 0 = Invalid JSON | 1 = Valid JSON, but invalid balance format
    let errorType = 0;
    try {
        customBalanceObj = JSON.parse(customBalanceInput.value);
        errorType++;

        if (!ValidateCustomBalancing(customBalanceObj)) {
            throw "Invalid JSON for custom balancing. Using default balancing.";
        }
    } catch (error) {
        //alert("Invalid JSON for custom balancing. Using default balancing.");
        
        switch(errorType) {
            case 0:
                GenerateAlertModal("Invalid JSON", "The JSON used is not valid JSON. You can validate your JSON <a href='https://jsonlint.com/' target='_blank'>here</a>.\n\nUsing default balancing.");
                break;
            case 1:
                GenerateAlertModal("Invalid Balance Format", "The JSON used is valid JSON, but is not in the correct format. Please refer to the balance creator to generate the correct format.\n\nUsing default balancing.");
                break;
        }        
        
        customBalanceInput.innerHTML = "";
        customBalanceInput.hidden = true;

        customBalanceDropdown.hidden = false;
        customBalanceLabel.hidden = false;
        balanceTypeBox.hidden = false;

        var customBalanceCheckbox = document.getElementById("custom-balancing-checkbox");
        customBalanceCheckbox.checked = false;
        customBalanceOverride = customBalanceCheckbox.checked;
        localStorage.setItem("customBalanceOverride", customBalanceOverride);
        
        currentBalancingIndex = 0;
        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

        currentBalancing = GetBalancePresetByID(currentBalancingIndex)["Balancing"];
    }

    return customBalanceObj;
}

/**
 * Gets the full list of perk permutations in a build where the total size of the returned permutations are of size n (2<=n<=4).
 * @param {Array} build The build to check for.
 * @returns {Array} The list of combo perks.
 */
function GetAllBuildCombos(build) {
    if (build == undefined) { return; }

    let ComboList = [];

    // Loop through build perks and acquire combo lists of size 2.
    for (var i = 0; i < build.length; i++) {
        for (var j = i+1; j < build.length; j++) {
            let currentPerk = build[i];
            let otherPerk = build[j];

            if (currentPerk == undefined) { continue; }
            if (otherPerk == undefined) { continue; }

            // let combo = [currentPerk, otherPerk];
            // DebugLog("COMBO: ");
            // DebugLog(combo);

            ComboList.push([currentPerk, otherPerk]);
        }
    }

    // Loop through combo list and acquire combos of size 3.
    for (var i = 0; i < build.length; i++) {
        for (var j = i+1; j < build.length; j++) {
            for (var k = j+1; k < build.length; k++) {
                let currentPerk = build[i];
                let otherPerk = build[j];
                let anotherPerk = build[k];

                if (currentPerk == undefined) { continue; }
                if (otherPerk == undefined) { continue; }
                if (anotherPerk == undefined) { continue; }

                // let combo = [currentPerk, otherPerk, anotherPerk];
                // DebugLog("COMBO: ");
                // DebugLog(combo);

                ComboList.push([currentPerk, otherPerk, anotherPerk]);
            }
        }
    }

    // Loop through combo list and acquire combos of size 4.
    var comboSize4 = [];
    for (var i = 0; i < build.length; i++) {
        if (build[i] == undefined) { continue; }

        comboSize4.push(build[i]);
    }
    if (comboSize4.length == 4) {
        ComboList.push(comboSize4);
    }

    return ComboList;

}

/**
 * Returns whether or not a particular combo is equivalent to one another.
 * @param {Array} currentCombo The first combo.
 * @param {Array} otherCombo The second combo.
 * @returns {boolean}
 */
function ComboIsEqual(currentCombo, otherCombo) {
    if (currentCombo == undefined) { return false; }
    if (otherCombo == undefined) { return false; }

    let sntzCurrent = [];
    let sntzOther = [];

    for (var i = 0; i < currentCombo.length; i++) {
        if (currentCombo[i] == undefined) { continue; }
        
        sntzCurrent.push(parseInt(currentCombo[i]["id"]));
    }

    for (var i = 0; i < otherCombo.length; i++) {
        if (otherCombo[i] == undefined) { continue; }
        
        sntzOther.push(parseInt(otherCombo[i]));
    }

    if (sntzCurrent.length != sntzOther.length) { return false; }

    sntzCurrent.sort();
    sntzOther.sort();

    DebugLog("CURRENT:");
    DebugLog(sntzCurrent);
    DebugLog("OTHER:");
    DebugLog(sntzOther);

    for (var i = 0; i < sntzCurrent.length; i++) {
        if (sntzCurrent[i] == undefined) { continue; }

        let currentID = sntzCurrent[i];
        let otherID = sntzOther[i];

        DebugLog(`Comparing ${currentID} to ${otherID}`);

        if (currentID != otherID) { return false; }
    }

    DebugLog("MATCH FOUND!");

    return true;
}

/**
 * Checks whether or not the current build contains banned combo perks in the current override. Adds it to a returned Error List if so.
 * 
 * Begins by looping through all killer-specific banned combos, checking whitelisted combos, then going through tiered bans skipping past any whitelisted combos.
 * @param {Array} build The build to assess.
 * @param {Object} override The killer override.
 * @param {Number} survivorIndex The index of the survivor build. Purely used for error generation purposes to show the user where the error is located.
 * @returns {Array} The list of errors.
 */
function ComboIsBannedInOverride(build, override, survivorIndex) {
    let ErrorList = [];

    let combos = GetAllBuildCombos(build);

    // DebugLog("COMBOS: ");
    // DebugLog(combos);

    // Loop through combos
    for (var i = 0; i < combos.length; i++) {
        
        // Get current combo
        let currentCombo = combos[i];

        let comboOverrideBans = [];
        comboOverrideBans = selectedRole == 0 ? override.SurvivorComboPerkBans : override.KillerComboPerkBans;

        // Check if combo is explicitly banned
        for (var j = 0; j < comboOverrideBans.length; j++) {
            let currentBannedCombo = comboOverrideBans[j];

            if (currentBannedCombo == undefined) { continue; }

            // Check if current combo is banned
            if (ComboIsEqual(currentCombo, currentBannedCombo)) {
                if (selectedRole == 0) {
                    ErrorList.push(
                        GenerateErrorObject(
                            "Banned Combo",
                            `Combo <b>${PrintCombo(currentCombo)}</b> is banned against <b>${override.Name}</b>. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                            undefined,
                            "iconography/ComboError.webp"
                        )
                    )
                } else {
                    ErrorList.push(
                        GenerateErrorObject(
                            "Banned Combo",
                            `Combo <b>${PrintCombo(currentCombo)}</b> is banned when playing as <b>${override.Name}</b>.`,
                            undefined,
                            "iconography/ComboError.webp"
                        )
                    )
                }
            }
        }

        // Check if combo is whitelisted
        var comboWhitelisted = false;
        // DebugLog(override);
        // DebugLog(override.SurvivorWhitelistedComboPerks);

        let comboWhitelist = [];
        comboWhitelist = selectedRole == 0 ? override.SurvivorWhitelistedComboPerks : override.KillerWhitelistedComboPerks;

        for (var j = 0; j < comboWhitelist.length; j++) {
            let currentWhitelistedCombo = comboWhitelist[j];

            if (currentWhitelistedCombo == undefined) { continue; }

            // Check if current combo is whitelisted
            if (ComboIsEqual(currentCombo, currentWhitelistedCombo)) {
                comboWhitelisted = true;
            }
        }


        let appliedTierList = [];
        appliedTierList = selectedRole == 0 ? override.SurvivorBalanceTiers : override.BalanceTiers;

        // Check if combo is banned by tier
        for (var j = 0; j < appliedTierList.length; j++) {
            let currentTierIndex = appliedTierList[j];
            let currentTier = currentBalancing.Tiers[currentTierIndex];

            if (currentTier == undefined) { continue; }

            let currentTierComboBans = [];
            currentTierComboBans = selectedRole == 0 ? currentTier.SurvivorComboPerkBans : currentTier.KillerComboPerkBans;

            // Check if current combo is banned
            for (var k = 0; k < currentTierComboBans.length; k++) {
                let currentBannedCombo = currentTierComboBans[k];

                if (currentBannedCombo == undefined) { continue; }
                if (comboWhitelisted) { break; }

                // Check if current combo is banned
                if (ComboIsEqual(currentCombo, currentBannedCombo)) {
                    if (selectedRole == 0) {
                        ErrorList.push(
                            GenerateErrorObject(
                                "Banned Combo",
                                `Combo <b>${PrintCombo(currentCombo)}</b> is banned in <b>${currentTier.Name}</b> Tier Balancing. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                                undefined,
                                "iconography/ComboError.webp"
                            )
                        )
                    } else {
                        ErrorList.push(
                            GenerateErrorObject(
                                "Banned Combo",
                                `Combo <b>${PrintCombo(currentCombo)}</b> is banned in <b>${currentTier.Name}</b> Tier Balancing.`,
                                undefined,
                                "iconography/ComboError.webp"
                            )
                        )
                    
                    }
                }
            }
        }
    }

    return ErrorList;
}

/**
 * Generated a displayable string of the specified perk combination.
 * @param {Array} combo The combo to generate the string for.
 * @returns {String} The displayable string in the format of "A + B + C"
 */
function PrintCombo(combo) {
    if (combo == undefined) { return; }

    var comboString = "";

    for (var i = 0; i < combo.length; i++) {
        let currentPerk = combo[i];

        if (currentPerk == undefined) { continue; }

        comboString += currentPerk["name"];
        if (i <= combo.length-2) {
            comboString += " + ";
        }
    }

    return comboString;
}

/**
 * Initially checks whether or not the current build contains banned perks in the current override, and if so adds it to a returned Error List.
 * 
 * Afterwards, it checks for whitelisted perks, then adds any banned perks that are non-whitelisted in tiered balancing to the Error List. Afterwards, the Error List is returned.
 * @param {Array} build The build to check for banned perks.
 * @param {object} override The override to check for banned perks in.
 * @returns {Array} The list of generated error objects.
 */
function IndividualIsBannedInOverride(build, override, survivorIndex) {
    //DebugLog("BUILD AND OVERRIDE:");
    //DebugLog(build);
    //DebugLog(override);
    if (build == undefined) { return; }
    if (override == undefined) { return; }

    ErrorList = [];

    // Loop through build perks
    for (var i = 0; i < build.length; i++) {
        var currentPerk = build[i];
        
        if (currentPerk == undefined) { continue; }
        // DebugLog(`Checking if ${currentPerk["name"]} is banned explicitly against ${override.Name}...`, true);

        // Check if explicitly banned
        // DebugLog(`OverrideIndvSurvivorPerkBans:`);
        let perkBanList = [];
        perkBanList = selectedRole == 0 ? override.SurvivorIndvPerkBans : override.KillerIndvPerkBans;

        for (var j = 0; j < perkBanList.length; j++) {
            var currentBannedPerk = parseInt(perkBanList[j]);

            if (currentBannedPerk == undefined) { continue; }
 
            console.log(`Checking if ${currentPerk["name"]} is banned explicitly against ${override.Name}...`);

            // DebugLog(`Checking if ${currentPerk["name"]} is banned against ${override.Name}...`);
            if (currentPerk["id"] == currentBannedPerk) {
                if (selectedRole == 0) {
                    ErrorList.push(
                        GenerateErrorObject(
                            "Banned Perk",
                            `Perk <b>${currentPerk["name"]}</b> is banned against <b>${override.Name}</b>. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                            undefined,
                            "iconography/PerkError.webp"
                        )
                    )
                } else {
                    ErrorList.push(
                        GenerateErrorObject(
                            "Banned Perk",
                            `Perk <b>${currentPerk["name"]}</b> is banned when playing as <b>${override.Name}</b>.`,
                            undefined,
                            "iconography/PerkError.webp"
                        )
                    )
                }
            }
        }

        // Check if current perk is whitelisted
        var perkWhitelisted = false;

        let currentWhitelist = []
        currentWhitelist = selectedRole == 0 ? override.SurvivorWhitelistedPerks : override.KillerWhitelistedPerks;

        DebugLog(`Checking if ${currentPerk["name"]} is whitelisted explicitly against ${override.Name}...`);
        for (var j = 0; j < currentWhitelist.length; j++) {
            var currentWhitelistedPerk = parseInt(currentWhitelist[j]);
            DebugLog(`perkName: ${currentPerk["name"]}`);
            DebugLog(`currentWhitelist: ${currentWhitelist}`);
            DebugLog(`currentWhitelistedPerk: ${currentWhitelistedPerk}`);

            if (currentPerk == undefined) { continue; }

            DebugLog(`Checking if ${currentPerk["name"]} is whitelisted against ${override.Name}...`)
            if (currentPerk["id"] == currentWhitelistedPerk) {
                perkWhitelisted = true;
                DebugLog(`Perk ${currentPerk["name"]} is whitelisted against ${override.Name}!`);
                break;
            }
        }

        // Check if banned by tier

        // DebugLog(`Checking if ${currentPerk["name"]} is banned by a tier in ${override.Name}...`);
        // DebugLog(override.SurvivorBalanceTiers);

        let appliedTierList = []; // List of tiers that are applied to the current override
        appliedTierList = selectedRole == 0 ? override.SurvivorBalanceTiers : override.BalanceTiers;
        
        for (var j = 0; j < appliedTierList.length; j++) {
            DebugLog(`Current Balance Tier: ${currentBalancing.Tiers[j].Name}`);
            if (perkWhitelisted) { break; }

            var currentTierIndex = appliedTierList[j];
            var currentTier = currentBalancing.Tiers[currentTierIndex];

            DebugLog(`Checking if ${currentPerk["name"]} is banned in ${currentTier.Name} Tier Balancing...`);

            if (currentTier == undefined) { continue; }

            // Check if current perk is banned
            let bannedIndvPerks = [];
            bannedIndvPerks = selectedRole == 0 ? currentTier.SurvivorIndvPerkBans : currentTier.KillerIndvPerkBans;

            for (var k = 0; k < bannedIndvPerks.length; k++) {
                var currentBannedPerk = parseInt(bannedIndvPerks[k]);

                if (currentPerk == undefined) { continue; }
                if (currentBannedPerk == undefined) { continue; }

                DebugLog(`Checking if ${currentPerk["name"]} is banned in ${currentTier.Name} Tier Balancing...`);
                if (currentPerk["id"] == currentBannedPerk) {
                    if (selectedRole == 0) {
                        ErrorList.push(
                            GenerateErrorObject(
                                "Banned Perk",
                                `Perk <b>${currentPerk["name"]}</b> is banned in <b>${currentTier.Name}</b> Tier Balancing. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                                undefined,
                                "iconography/PerkError.webp"
                            )
                        )
                    } else {
                        ErrorList.push(
                            GenerateErrorObject(
                                "Banned Perk",
                                `Perk <b>${currentPerk["name"]}</b> is banned in <b>${currentTier.Name}</b> Tier Balancing.`,
                                undefined,
                                "iconography/PerkError.webp"
                            )
                        )
                    }
                }
            }

        }
    }

    return ErrorList;
}

/**
 * Gets a map object by the passed in ID.
 * @param {Number} id 
 * @returns 
 */
function GetMapByID(id) {
    for (var i = 0; i < Maps.length; i++) {
        if (Maps[i]["ID"] == id) {
            return Maps[i];
        }
    }

    return null;
}

/**
 * Gets a passed in balancing preset by its ID parameter by looping through the entire length and stopping when the ID property matches the passed in argument.
 * @param {Number} id 
 * @returns {object} The balance object.
 */
function GetBalancePresetByID(id) {
    for (var i = 0; i < BalancePresets.length; i++) {
        if (BalancePresets[i]["ID"] == id) {
            return BalancePresets[i];
        }
    }
    return null;
}

/**
 * Validates whether or not the selected killer's add-ons belong to the selected killer.
 * @returns {Boolean}
 */
function AreKillerAddonsValid() {
    let addons = KillerAddons;

    let undefinedCpt = 0;
    for (var i = 0; i < addons.length; i++) {
        let currentAddon = addons[i];

        if (currentAddon == undefined) { 
            undefinedCpt++;
            continue; 
        }
        
        let selectedKillerName = Killers[selectedKiller];
        let selectedKillerAddons = KillerAddonsList[selectedKiller]["Addons"];

        for (var j = 0; j < selectedKillerAddons.length; j++) {
            let currentKillerAddon = selectedKillerAddons[j];

            if (currentAddon["Name"] == currentKillerAddon["Name"]) {
                return true;
            }
        }
    }

    if (undefinedCpt == addons.length) {
        return true;
    }

    return false;
}