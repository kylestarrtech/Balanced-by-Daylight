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
 
            DebugLog(`Checking if ${currentPerk["name"]} is banned explicitly against ${override.Name}...`);

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

function ClearKillerPerks() {
    for (var i = 0; i < KillerPerks.length; i++) {
        KillerPerks[i] = null;
    }

    if (Config.saveBuilds && saveLoadoutsAndKiller) {
        localStorage.setItem("KillerPerks", JSON.stringify(KillerPerks));
    }
}

function ClearKillerAddons() {
    KillerAddons = [undefined, undefined];

    if (Config.saveBuilds && saveLoadoutsAndKiller) {
        localStorage.setItem("KillerAddons", JSON.stringify(KillerAddons));
    }

    UpdatePerkUI();
}

function ClearSurvivorPerks() {
    for (var i = 0; i < SurvivorPerks.length; i++) {
        SurvivorPerks[i] = [
            null,
            null,
            null,
            null
        ];
    }

    if (Config.saveBuilds && saveLoadoutsAndKiller) {
        localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
    }
}

function ClearSurvivorOfferings() {
    for (var i = 0; i < SurvivorOfferings.length; i++) {
        SurvivorOfferings[i] = null;
    }

    if (Config.saveBuilds && saveLoadoutsAndKiller) {
        localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
    }
}

function ClearSurvivorItems() {
    for (var i = 0; i < SurvivorItems.length; i++) {
        SurvivorItems[i] = null;
    }
    
    if (Config.saveBuilds && saveLoadoutsAndKiller) {
        localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
    }
}

function ClearSurvivorAddons() {
    for (var i = 0; i < SurvivorAddons.length; i++) {
        SurvivorAddons[i] = [
            undefined,
            undefined
        ];
    }

    if (Config.saveBuilds && saveLoadoutsAndKiller) {
        localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
    }
}

/**
 * Gets the export data for a loadout and compresses it into an import code.
 * @returns {String} The compressed import code.
 */
function GetExportData() {
    const survivorPerksId = new Array()
    for(const surv of SurvivorPerks){
        const perksId = new Array()
        for(const perk of surv){
            if (perk == null) {
                perksId.push(null)
                continue;
            }

            perksId.push(perk.id)
        }
        survivorPerksId.push(perksId)
    }

    const survivorOfferingsId = new Array()
    for(const offering of SurvivorOfferings){
        if (offering == null) {
            survivorOfferingsId.push(null)
            continue;
        }

        survivorOfferingsId.push(offering?.id)
    }

    const survivorItemsId = new Array()
    const survivorAddonInfo = new Array()

    for (var i = 0; i < SurvivorItems.length; i++) {
        survivorItemsId.push(SurvivorItems[i]?.id);

        const currentAddons = SurvivorAddons[i];

        survivorAddonInfo.push(
            [
                [
                    currentAddons[0]?.id,
                    currentAddons[1]?.id
                ],
                SurvivorItems[i] == null ? null : SurvivorItems[i]["Type"]
            ]
        );
    }

    const killerPerksId = new Array()
    
    for(const perk of KillerPerks){
        if (perk == null) {
            killerPerksId.push(null)
            continue;
        }
        killerPerksId.push(perk.id)
    }

    const killerOfferingId = KillerOffering == null ? null : KillerOffering.id

    const killerAddonsId = new Array()

    for(const addon of KillerAddons){
        if (addon == null) {
            killerAddonsId.push(null)
            continue;
        }
        killerAddonsId.push(addon["globalID"])
    }


    const exportJson = {
        "selectedRole": selectedRole,
        "survivorPerksId": survivorPerksId,
        "survivorOfferingsId": survivorOfferingsId,
        "survivorItemsId": survivorItemsId,
        "survivorAddonInfo": survivorAddonInfo,
        "killerPerksId": killerPerksId,
        "killerOfferingId": killerOfferingId,
        "killerAddonsId": killerAddonsId,
        "selectedKiller": selectedKiller,
        "currentBalancingIndex": currentBalancingIndex,
        "customBalanceOverride": customBalanceOverride,
        "onlyShowNonBanned": onlyShowNonBanned,
        "currentBalancing": customBalanceOverride ? currentBalancing : null,
        "numErrors": MasterErrorList.length,
    }

    DebugLog(exportJson);

    const exportData = JSON.stringify(exportJson);

    const deflate = pako.deflate(exportData, { to: "string" });
    const compressedText = btoa(String.fromCharCode.apply(null, deflate));

    return compressedText;
}

/**
 * Generates and returns a list of banned perks as and against the selected killer.
 * @returns {Array} The list of banned perks.
 */
function GetBannedPerks() {
    let bannedPerks = new Array()
    
    // Concatenate survivor perk bans
    bannedPerks = bannedPerks.concat(currentBalancing.KillerOverride[selectedKiller].SurvivorIndvPerkBans)

    // Concatenate tier survivor bans based on killer overrides
    for(const tier of currentBalancing.KillerOverride[selectedKiller].SurvivorBalanceTiers){
        bannedPerks = bannedPerks.concat(currentBalancing.Tiers[tier].SurvivorIndvPerkBans)
    }

    // Concatenate killer perk bans
    bannedPerks = bannedPerks.concat(currentBalancing.KillerOverride[selectedKiller].KillerIndvPerkBans)

    // Concatenate tier killer bans based on killer overrides
    for(const tier of currentBalancing.KillerOverride[selectedKiller].BalanceTiers){
        bannedPerks = bannedPerks.concat(currentBalancing.Tiers[tier].KillerIndvPerkBans)
    }

    let concatenatedWhitelist = new Array()

    // Concatenate KillerWhitelistedPerks and SurvivorWhitelistedPerks
    concatenatedWhitelist = concatenatedWhitelist.concat(currentBalancing.KillerOverride[selectedKiller].KillerWhitelistedPerks)
    concatenatedWhitelist = concatenatedWhitelist.concat(currentBalancing.KillerOverride[selectedKiller].SurvivorWhitelistedPerks)
    DebugLog(`Concatenated whitelist: ${concatenatedWhitelist}`)

    for (const perk of concatenatedWhitelist) {
        // If the perk is in the banned perks, remove it
        if (bannedPerks.includes(perk)) {
            bannedPerks.splice(bannedPerks.indexOf(perk), 1);
        }
    }

    return bannedPerks;
}

/**
 * Generates and returns a list of all offerings banned as and against the selected killer.
 * @returns {Array} The list of banned offerings.
 */
function GetBannedOfferings() {

    DebugLog("Is current balancing set?");
    DebugLog(currentBalancing);

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (Offerings == undefined) { return null; }

    let bannedOfferings = {
        "Survivor": new Array(),
        "Killer": new Array()
    }

    // Get survivor offerings from killer override
    let survivorOfferings = currentBalancing.KillerOverride[selectedKiller].SurvivorOfferings;

    // Get killer offerings from killer override
    let killerOfferings = currentBalancing.KillerOverride[selectedKiller].KillerOfferings;

    for (const offering of Offerings["Survivor"]) {
        // If the offering is not in the survivor offerings, add it to the banned offerings
        if (!survivorOfferings.includes(offering.id)) {
            bannedOfferings["Survivor"].push(offering.id);
        }
    }

    for (const offering of Offerings["Killer"]) {
        // If the offering is not in the killer offerings, add it to the banned offerings
        if (!killerOfferings.includes(offering.id)) {
            bannedOfferings["Killer"].push(offering.id);
        }
    }

    return bannedOfferings;
}

/**
 * Generates and returns a list of all banned items against the selected killer.
 * @returns {Array} The list of banned items.
 */
function GetBannedItems() {
    DebugLog("Is current balancing set?");
    DebugLog(currentBalancing);

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (Items == undefined) { return null; }

    let bannedItems = new Array()

    // Get items from killer override
    let items = currentBalancing.KillerOverride[selectedKiller].ItemWhitelist;
    if (items == undefined) { return null; }
    DebugLog("ITEMS:")
    DebugLog(items);
    
    for (const item of Items["Items"]) {
        // If the item is not in the items, add it to the banned items
        //DebugLog(`Checking if ${item.id} is in ${items}`);
        if (!items.includes(item.id)) {
            //DebugLog(`${item.id} is not in ${items}`);
            bannedItems.push(item.id);
        }
    }

    return bannedItems;
}

/**
 * A function to get the ID of a perk based on its file name.
 * @param {string} fileName The file name of the perk.
 * @returns {number} The ID of the perk.
 */
function GetPerkIdByFileName(fileName){
    for(const perk of Perks){
        if(perk.icon == fileName) return perk.id
    }
}

/**
 * A function to get a perk object by its ID.
 * @param {number} id The ID of the perk.
 * @returns {object} The perk object.
 */
function GetPerkById(id){
    for(const perk of Perks){
        if(perk.id == id) return perk
    }
}

/**
 * A function to get the ID of an offering based on its file name.
 * @param {string} fileName The file name of the offering.
 * @returns {number} The ID of the offering.
 */
function GetOfferingIdByFileName(fileName){
    let SurvivorOfferings = Offerings["Survivor"];
    let KillerOfferings = Offerings["Killer"];

    for(const offering of SurvivorOfferings){
        if(offering.icon == fileName) return offering.id
    }

    for(const offering of KillerOfferings){
        if(offering.icon == fileName) return offering.id
    }
}

/**
 * Gets the ID of an item based on the file path of its icon.
 * @param {string} fileName 
 * @returns 
 */
function GetItemIdByFileName(fileName) {
    let itemsList = Items["Items"];

    for (var i = 0; i < itemsList.length; i++) {
        let currentItem = itemsList[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["icon"] == fileName) {
            return currentItem["id"];
        }
    }

    return undefined;
}

/**
 * A function to get an offering object by its ID.
 * @param {number} id The ID of the offering.
 * @returns {object} The offering object.
 */
function GetOfferingById(id){
    let SurvivorOfferings = Offerings["Survivor"];
    let KillerOfferings = Offerings["Killer"];

    for(const offering of SurvivorOfferings){
        if(offering.id == id) return offering
    }

    for(const offering of KillerOfferings){
        if(offering.id == id) return offering
    }

    return undefined
}

/**
 * Gets an item's details based on its ID.
 * @param {number} id 
 * @returns {object}
 */
function GetItemById(id) {
    let itemsList = Items["Items"];

    for (var i = 0; i < itemsList.length; i++) {
        let currentItem = itemsList[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["id"] == id) {
            return currentItem;
        }
    }

    return undefined;
}

/**
 * Gets a killer add-on's details based on its ID.
 * @param {number} id 
 * @returns {object}
 */
function GetKillerAddonById(id) {
    for (let i = 0; i < KillerAddonsList.length; i++) {
        let currentKiller = KillerAddonsList[i];

        for (let j = 0; j < currentKiller["Addons"].length; j++) {
            let currentAddon = currentKiller["Addons"][j];

            if (currentAddon["globalID"] == id) {
                return currentAddon;
            }
        }
    }

    return undefined;
}

/**
 * Gets a killer add-on's details based on its name.
 * 
 * If two add-ons share the same name the first one will be returned (e.g. Speed Limiter).
 * @param {string} name 
 * @returns {object}
 */
function GetKillerAddonByName(name) {
    for (let i = 0; i < KillerAddonsList.length; i++) {
        let currentKiller = KillerAddonsList[i];

        for (let j = 0; j < currentKiller["Addons"].length; j++) {
            let currentAddon = currentKiller["Addons"][j];

            if (currentAddon["Name"].toLowerCase() == name.toLowerCase()) {
                return currentAddon;
            }
        }
    }

    return undefined;
}

/**
 * A function to get the name of an addon based on its ID.
 * @param {string} itemType The type of item the addon belongs to.
 * @param {number} id The ID of the addon.
 */
function GetAddonById(itemType, id) {
    if (Items == undefined) { return undefined; }

    let ItemTypes = Items["ItemTypes"];
    if (ItemTypes == undefined) { return undefined; }

    // Find item type index
    let itemTypeIndex = undefined;
    for (var i = 0; i < ItemTypes.length; i++) {
        let currentItem = ItemTypes[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["Name"] == itemType) {
            itemTypeIndex = i;
            break;
        }
    }
    if (itemTypeIndex == undefined) { return undefined; }

    let addons = ItemTypes[itemTypeIndex]["Addons"];
    if (addons == undefined) { return undefined; }

    for (var i = 0; i < addons.length; i++) {
        let currentAddon = addons[i];

        if (currentAddon == undefined) { continue; }

        if (currentAddon["id"] == id) {
            return currentAddon;
        }
    }

    return undefined;
}

/**
 * A function to get the index of an item type based on its name.
 * @param {string} itemType The name of the item type.
 */
function GetIndexOfItemType(itemType) {
    if (Items == undefined) { return; }

    let ItemTypes = Items["ItemTypes"];
    for (var i = 0; i < ItemTypes.length; i++) {
        let currentItem = ItemTypes[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["Name"] == itemType) {
            return i;
        }
    }

    return -1;
}

/**
 * A function to print to the console if debugging is enabled.
 * @param {object} text The text to print to the console.
 * @param {boolean} printStackTrace Whether or not to print the current stack trace.
 * @returns 
 */
function DebugLog(text, printStackTrace = false) {
    if (!debugging) { return; }

    console.log(text);

    if (!printStackTrace && !overrideStackTrace) { return; }
    // Print current stack trace
    console.trace();
}

/**
 * A function to check if a build contains a perk.
 * @param {number} perkID The ID of the perk to check for.
 * @param {object} build The build to check for the perk in.
 * @returns {boolean} Whether or not the build contains the perk.
 */
function BuildHasPerk(perkID, build) {
    if (build == undefined) { return false; }

    for (var i = 0; i < build.length; i++) {
        let currentPerk = build[i];

        if (currentPerk == undefined) { continue; }

        if (currentPerk["id"] == perkID) {
            return true;
        }
    }

    return false;
}

/**
 * A function to generate an error object.
 * @param {string} name The title of the error.
 * @param {string} reason The reason for the error.
 * @param {string} stacktrace The stacktrace of the error.
 * @param {string} icon The icon to display for the error.
 * @param {boolean} criticalError Whether or not the error is critical.
 * @returns {object} An object containing the error information.
 */
function GenerateErrorObject(
    name = "Default Error",
    reason = "Default Reason",
    stacktrace = undefined,
    icon = "iconography/Error.webp",
    criticalError = false) {
        return {
            ERROR: name,
            REASON: reason,
            STACKTRACE: stacktrace,
            ICON: icon,
            CRITICAL: criticalError
        };
    }

/**
 * A function to validate a custom balancing object.
 * @param {object} balanceObj The balance object to validate.
 * @returns {boolean} Whether or not the balance object is valid.
 */
function ValidateCustomBalancing(balanceObj) {
    if (balanceObj == undefined) { return false; }

    if (balanceObj["Name"] == undefined) { return false; }
    if (balanceObj["MaxPerkRepetition"] == undefined) { return false; }

    if (balanceObj["Tiers"] == undefined) { return false; }
    try {

        for (var i = 0; i < balanceObj["Tiers"].length; i++) {
            let currentTier = balanceObj["Tiers"][i];

            if (currentTier["Name"] == undefined) { return false; }

            if (currentTier["SurvivorIndvPerkBans"] == undefined) { return false; }
            if (currentTier["SurvivorComboPerkBans"] == undefined) { return false; }
            if (currentTier["KillerIndvPerkBans"] == undefined) { return false; }
            if (currentTier["KillerComboPerkBans"] == undefined) { return false; }
        }
    } catch (error) {
        return false;
    }

    if (balanceObj["KillerOverride"] == undefined) { return false; }

    try {
        for (var i = 0; i < balanceObj["KillerOverride"].length; i++) {
            let currentOverride = balanceObj["KillerOverride"][i];
    
            if (currentOverride["Name"] == undefined) { return false; }
            if (currentOverride["Map"] == undefined) { return false; }
            if (currentOverride["BalanceTiers"] == undefined) { return false; }
            if (currentOverride["SurvivorBalanceTiers"] == undefined) { return false; }

            if (currentOverride["SurvivorIndvPerkBans"] == undefined) { return false; }
            if (currentOverride["SurvivorComboPerkBans"] == undefined) { return false; }
            if (currentOverride["KillerIndvPerkBans"] == undefined) { return false; }
            if (currentOverride["KillerComboPerkBans"] == undefined) { return false; }

            if (currentOverride["SurvivorWhitelistedPerks"] == undefined) { return false; }
            if (currentOverride["SurvivorWhitelistedComboPerks"] == undefined) { return false; }
            if (currentOverride["KillerWhitelistedPerks"] == undefined) { return false; }
            if (currentOverride["KillerWhitelistedComboPerks"] == undefined) { return false; }

            if (currentOverride["AddonTiersBanned"] == undefined) { return false; }
            if (currentOverride["IndividualAddonBans"] == undefined) { return false; }

            if (currentOverride["ItemWhitelist"] == undefined) { return false; }
            if (currentOverride["AddonWhitelist"] == undefined) { return false; }

            if (currentOverride["SurvivorOfferings"] == undefined) { return false; }
            if (currentOverride["KillerOfferings"] == undefined) { return false; }
        }

        if (balanceObj["KillerOverride"].length <= 0) { return false; }
        
        // Check which killer overrides are valid

        for (var i = 0; i < balanceObj["KillerOverride"].length; i++) {
            
        }
    } catch (error) {
        return false;
    }

    return true;
}

function GenerateImageFromButtonPress() {
    if (!AreKillerAddonsValid()) {
        GenerateAlertModal("Error", "Your killer addons are not valid for the selected killer. Please select valid addons before generating an image.");
        return;
    }

    let exportData = GetExportData();

    const imageGenContainer = document.getElementById("image-gen-container");
    imageGenContainer.hidden = false;

    const imageGenTitle = document.getElementById("image-gen-title");
    imageGenTitle.innerText = "Generating Image...";

    const imageGenImage = document.getElementById("image-gen-image");
    imageGenImage.hidden = true;

    const imageGenMessage = document.getElementById("image-gen-message");
    imageGenMessage.innerText = "Please wait while your loadout image is generated...";

    var xhttp = new XMLHttpRequest();
    
    const imageGenOkButton = document.getElementById("image-gen-ok-button");
    imageGenOkButton.innerText = "Cancel";

    imageGenOkButton.addEventListener("click", function() {
        // If the xhttp request is still running, abort it
        if (xhttp.readyState != 4) {
            xhttp.abort();
        }

        imageGenContainer.hidden = true;
    });

    xhttp.responseType = "arraybuffer"

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    // This is the encoded image data.
                    let imageBuffer = this.response;

                    const imageBlob = new Blob([imageBuffer], { type: "image/png" });

                    const imageUrl = URL.createObjectURL(imageBlob);

                    const imageElement = document.getElementById("image-gen-image");
                    imageElement.src = imageUrl;
                    imageElement.hidden = false;

                    imageGenTitle.innerText = "Generated Loadout Image";

                    imageGenMessage.innerText = "Your loadout image has been generated! Feel free to save/copy it.";

                    imageGenOkButton.addEventListener("click", function() {
                        // Revoke the image URL
                        URL.revokeObjectURL(imageUrl);
                    });
                    imageGenOkButton.innerText = "Close";
                break;
                default:
                    GenerateAlertModal("Error", "An error occurred while generating your image.");
                    console.error("Error getting image: " + this.status);
            }
        }
    };
    xhttp.open("POST", "/get-build-image", true);
    xhttp.setRequestHeader("Content-type", "application/json");

    xhttp.send(JSON.stringify({
        ExportData: exportData
    }));
}

/**
 * Returns true or false depending on whether or not the option should be visible when searched with query.
 * @param {Number} presetID 
 * @param {String} query 
 * @returns {Boolean}
 */
function GetBalanceSelectOptionVisibilityInSearch(presetID, query) {
    /**
     * Does the name include the query? True.
     * Loop through every alias.
     *      Does this alias include the query? True.
     * Are we searching for specifically an ID? (isNumber?)
     * 
     * False.
     */

    const currentPreset = GetBalancePresetByID(presetID);

    if (currentPreset == undefined) { return false; }

    const name = currentPreset["Name"];
    const aliases = currentPreset["Aliases"];
    let splitAliases = undefined;

    
    if (aliases != undefined) {
        try {
            splitAliases = aliases.split(",");
        } catch {
            console.error("Aliases value was undefined! This has been handled appropriately!");
        }
    }

    if (name.includes(query)) {
        return true;
    }

    if (splitAliases != undefined) {
        for (let i = 0; i < splitAliases.length; i++) {
            const alias = splitAliases[i];

            if (alias.includes(query)) {
                return true;
            }
        }
    }

    if (!isNaN(query)) { // If the query is numeric
        const queryNum = Math.round(parseFloat(query));

        if (queryNum == presetID) {
            return true;
        }
    }

    return false;
}