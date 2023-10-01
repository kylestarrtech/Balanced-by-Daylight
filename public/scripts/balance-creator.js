debugging = true;

Perks = null;
Killers = null;
Survivors = null;
Maps = null;
Addons = null;
Offerings = null;
MaximumPerkRepetition = 1;
const version = 1;

/**
 * @type {boolean} AllDataLoaded - Used to check if all data (perks, addons, offerings, maps .etc) has been loaded
 */
AllDataLoaded = false;

Tiers = [];
KillerBalance = [];

// Constant Variable to reference rarity colours
TIER_RARITY_COLOURS = {
    "COMMON": "#614022",
    "UNCOMMON": "#937c34",
    "RARE": "#116814",
    "VERY_RARE": "#1d1b6a",
    "ULTRA_RARE": "#e6064d"
}

TIER_RARITY_COLOURLIST = [
    TIER_RARITY_COLOURS.COMMON,
    TIER_RARITY_COLOURS.UNCOMMON,
    TIER_RARITY_COLOURS.RARE,
    TIER_RARITY_COLOURS.VERY_RARE,
    TIER_RARITY_COLOURS.ULTRA_RARE
]

function main() {
    GetPerks();

    SetSearchEvents();
    SetTierEvents();
    Tiers.push(CreateTier("General"));
    LoadTier(0);

    SetKillerBalancing();
    SetMiscDropdownEvents();
    SetTierButtonEvents();
    SetKillerOverrideEvents();
    
    // A timer that launches LoadKillerOverrideUI(0); if AllDataLoaded is true, if not then it will wait 100ms and try again, if it is true then it will stop the timer
    var timer = setInterval(function() {
        if (AllDataLoaded) {
            LoadKillerOverrideUI(0);
            clearInterval(timer);
        }
    }, 100);

    SetImportExportButtonEvents();

    // Fill listbox with all Survivor perks by default.
    OverrideButtonSearch("", true);

    // Update all tier, killer, and map dropdowns
    UpdateDropdowns();
}

function SetImportExportButtonEvents() {
    // Import Button
    var importButton = document.getElementById("balance-import-button");

    // Export Button
    var exportButton = document.getElementById("balance-export-button");

    exportButton.addEventListener("click", function() {
        ExportBalancing();
    });

    importButton.addEventListener("click", function() {
        ImportBalancing();
    });
}

function SetMiscDropdownEvents() {
    // Update perk repetition event
    var perkRepetitionDropdown = document.getElementById("maximum-perk-repetition-dropdown");
    perkRepetitionDropdown.addEventListener("change", function() {
        MaximumPerkRepetition = parseInt(perkRepetitionDropdown.value);
        DebugLog(`Maximum Perk Repetition set to <b>${MaximumPerkRepetition}</b>`);
    }); 
}

function SetTierButtonEvents() {
    // Set Tier Dropdown Change Event
    var tierDropdown = document.getElementById("tier-selection-dropdown");
    tierDropdown.addEventListener("change", function() {
        LoadTierByName(tierDropdown.value);
    });

    // Get Individual Perk Ban Buttons

    // Add
    var SrvIndvPrkBanButton = document.getElementById("survivor-individual-perk-ban-add-button");
    var KlrIndvPrkBanButton = document.getElementById("killer-individual-perk-ban-add-button");

    // Remove
    var SrvIndvRmvPrkBanButton = document.getElementById("survivor-individual-perk-ban-remove-button");
    var KlrIndvRmvPrkBanButton = document.getElementById("killer-individual-perk-ban-remove-button");

    // Get Combined Perk Ban Buttons

    // Add
    var SrvComboPrkBanButton = document.getElementById("survivor-combined-perk-ban-add-button");
    var KlrComboPrkBanButton = document.getElementById("killer-combined-perk-ban-add-button");

    // Remove
    var SrvComboRmvPrkBanButton = document.getElementById("survivor-combined-perk-ban-remove-button");
    var KlrComboRmvPrkBanButton = document.getElementById("killer-combined-perk-ban-remove-button");

    DebugLog("Click");
    // Add On Click Events
    SrvIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        DebugLog(selectedPerks);

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}
        DebugLog(`Passed Tier Index Guard Clause ${tierIndex}`);

        // Add the perks to the tier
        for (var i = 0; i < selectedPerks.length; i++) {
            if (!Perks[selectedPerks[i]].survivorPerk) { continue; }
            Tiers[tierIndex].SurvivorIndvPerkBans.push(selectedPerks[i]);
        }

        LoadTier(tierIndex);
    });

    KlrIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        // Add the perks to the tier
        for (var i = 0; i < selectedPerks.length; i++) {
            if (Perks[selectedPerks[i]].survivorPerk) { continue; }
            Tiers[tierIndex].KillerIndvPerkBans.push(selectedPerks[i]);
        }

        LoadTier(tierIndex);
    });

    SrvComboPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        var ComboObj = [];
        // Create the perk combo, then add it to the tier
        if (selectedPerks.length < 2) { console.error("Not enough perks selected!"); return; }
        if (selectedPerks.length > 4) { console.error("Too many perks selected!"); return; }

        for (var i = 0; i < selectedPerks.length; i++) {
            if (!Perks[selectedPerks[i]].survivorPerk) { continue; }

            ComboObj.push(selectedPerks[i]);
        }
        DebugLog(ComboObj)
        Tiers[tierIndex].SurvivorComboPerkBans.push(ComboObj);
        DebugLog(Tiers[tierIndex]);

        LoadTier(tierIndex);
    });

    KlrComboPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        var ComboObj = [];
        // Create the perk combo, then add it to the tier
        if (selectedPerks.length < 2) { console.error("Not enough perks selected!"); return; }
        if (selectedPerks.length > 4) { console.error("Too many perks selected!"); return; }

        for (var i = 0; i < selectedPerks.length; i++) {
            if (Perks[selectedPerks[i]].survivorPerk) { return; }

            ComboObj.push(selectedPerks[i]);
        }
        DebugLog(ComboObj)
        Tiers[tierIndex].KillerComboPerkBans.push(ComboObj);
        DebugLog(Tiers[tierIndex]);
        
        LoadTier(tierIndex);
    });

    // Remove On Click Events
    SrvIndvRmvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("survivor-individual-perk-ban-dropdown"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        // Remove the perks from the tier
        for (var i = 0; i < selectedPerks.length; i++) {
            Tiers[tierIndex].SurvivorIndvPerkBans.splice(Tiers[tierIndex].SurvivorIndvPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadTier(tierIndex);
    });

    KlrIndvRmvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("killer-individual-perk-ban-dropdown"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        // Remove the perks from the tier
        for (var i = 0; i < selectedPerks.length; i++) {
            Tiers[tierIndex].KillerIndvPerkBans.splice(Tiers[tierIndex].KillerIndvPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadTier(tierIndex);
    });

    SrvComboRmvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("survivor-combined-perk-ban-dropdown"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        // Remove the perks from the tier
        for (var i = 0; i < selectedPerks.length; i++) {
            Tiers[tierIndex].SurvivorComboPerkBans.splice(Tiers[tierIndex].SurvivorComboPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadTier(tierIndex);
    });

    KlrComboRmvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("killer-combined-perk-ban-dropdown"));

        // Get the selected tier
        var selectedTier = document.getElementById("tier-selection-dropdown").value;

        // Get the index of the tier with the same name
        var tierIndex = -1;
        for (var i = 0; i < Tiers.length; i++) {
            if (Tiers[i].Name == selectedTier) {
                tierIndex = i;
                continue;
            }
        }
        if (tierIndex == -1) { console.error("Invalid tier name!"); return;}

        // Remove the perks from the tier
        for (var i = 0; i < selectedPerks.length; i++) {
            Tiers[tierIndex].KillerComboPerkBans.splice(Tiers[tierIndex].KillerComboPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadTier(tierIndex);
    });
}

function SetKillerOverrideEvents() {

    DebugLog("<b>Setting Killer Override UI Events...</b>");

    // Get the primary Killer dropdown
    var killerDropdown = document.getElementById("killer-selection-dropdown");
    killerDropdown.addEventListener("change", function() {
        LoadKillerOverrideUIByName(GetCurrentKiller());
    });
    DebugLog("Set Killer Dropdown Override Event")

    var antiFacecampCheckbox = document.getElementById("killer-antifacecamp-checkbox");
    antiFacecampCheckbox.addEventListener("change", function() {
        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        KillerBalance[selectedKillerIndex].AntiFacecamp = antiFacecampCheckbox.checked;
        DebugLog(`Anti-Facecamp set to <b>${KillerBalance[selectedKillerIndex].AntiFacecamp}</b> for <b>${KillerBalance[selectedKillerIndex].Name}</b>`);
    });

    AddonCheckboxBanIDList = [
        ["killer-addon-ban-checkbox-common", "Common"],
        ["killer-addon-ban-checkbox-uncommon", "Uncommon"],
        ["killer-addon-ban-checkbox-rare", "Rare"],
        ["killer-addon-ban-checkbox-veryrare", "Very Rare"],
        ["killer-addon-ban-checkbox-iridescent", "Ultra Rare"]
    ]

    document.getElementById(AddonCheckboxBanIDList[0][0]).addEventListener("change", function() {
        DebugLog("Banning Common Addons");

        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        var curBanRar = KillerBalance[selectedKillerIndex].AddonTiersBanned;

        if (curBanRar.includes(0)) {
            curBanRar.splice(curBanRar.indexOf(0), 1);
        } else {
            curBanRar.push(0);
        }

        DebugLog(KillerBalance[selectedKillerIndex].AddonTiersBanned);
    });

    document.getElementById(AddonCheckboxBanIDList[1][0]).addEventListener("change", function() {
        DebugLog("Banning Uncommon Addons");

        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        var curBanRar = KillerBalance[selectedKillerIndex].AddonTiersBanned;

        if (curBanRar.includes(1)) {
            curBanRar.splice(curBanRar.indexOf(1), 1);
        } else {
            curBanRar.push(1);
        }

        DebugLog(KillerBalance[selectedKillerIndex].AddonTiersBanned);
    });

    document.getElementById(AddonCheckboxBanIDList[2][0]).addEventListener("change", function() {
        DebugLog("Banning Rare Addons");

        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        var curBanRar = KillerBalance[selectedKillerIndex].AddonTiersBanned;

        if (curBanRar.includes(2)) {
            curBanRar.splice(curBanRar.indexOf(2), 1);
        } else {
            curBanRar.push(2);
        }

        DebugLog(KillerBalance[selectedKillerIndex].AddonTiersBanned);
    });

    document.getElementById(AddonCheckboxBanIDList[3][0]).addEventListener("change", function() {
        DebugLog("Banning Very Rare Addons");

        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        var curBanRar = KillerBalance[selectedKillerIndex].AddonTiersBanned;

        if (curBanRar.includes(3)) {
            curBanRar.splice(curBanRar.indexOf(3), 1);
        } else {
            curBanRar.push(3);
        }

        DebugLog(KillerBalance[selectedKillerIndex].AddonTiersBanned);
    });

    document.getElementById(AddonCheckboxBanIDList[4][0]).addEventListener("change", function() {
        DebugLog("Banning Iridescent Addons");

        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        var curBanRar = KillerBalance[selectedKillerIndex].AddonTiersBanned;

        if (curBanRar.includes(4)) {
            curBanRar.splice(curBanRar.indexOf(4), 1);
        } else {
            curBanRar.push(4);
        }

        DebugLog(KillerBalance[selectedKillerIndex].AddonTiersBanned);
    });

    for (var i = 0; i < AddonCheckboxBanIDList.length; i++) {
        var curCheckbox = document.getElementById(AddonCheckboxBanIDList[i][0]);
        curCheckbox.addEventListener("change", function() {
            LoadKillerOverrideUI(GetCurrentKillerIndex());
        });
    }

    // Set the Confirm Addon(s) Button Event
    var addonConfirmButton = document.getElementById("killer-individual-addon-ban-confirmation-button");
    addonConfirmButton.addEventListener("click", function() {
        // Get the addons selected
        var selectedAddons = GetSelectValues(document.getElementById("killer-individual-addon-ban-dropdown"));

        // Get the selected killer
        var selectedKiller = GetCurrentKillerIndex();
        if (selectedKiller == -1) { console.error("Invalid killer name!"); return;}

        // Add the addon selections to the killer if they are not already in the list
        for (var i = 0; i < selectedAddons.length; i++) {
            if (KillerBalance[selectedKiller].IndividualAddonBans.includes(selectedAddons[i])) { continue; }
            KillerBalance[selectedKiller].IndividualAddonBans.push(selectedAddons[i]);
        }

        DebugLog(`Added <b>${selectedAddons}</b> to <b>${KillerBalance[selectedKiller].Name}</b>`);
        LoadKillerOverrideUI(selectedKiller);
    });

    // Set the Remove Addon(s) Button Event
    var addonRemoveButton = document.getElementById("killer-individual-addon-ban-remove-bans-button");
    addonRemoveButton.addEventListener("click", function() {
        // Get the addons selected
        var selectedAddons = GetSelectValues(document.getElementById("killer-individual-addon-confirmed-bans-dropdown"));
        
        // Get the selected killer
        var selectedKiller = GetCurrentKillerIndex();
        if (selectedKiller == -1) { console.error("Invalid killer name!"); return;}

        // Remove the addon selections from the killer if they are in the list
        for (var i = 0; i < selectedAddons.length; i++) {
            if (!KillerBalance[selectedKiller].IndividualAddonBans.includes(selectedAddons[i])) { continue; }
            KillerBalance[selectedKiller].IndividualAddonBans.splice(KillerBalance[selectedKiller].IndividualAddonBans.indexOf(selectedAddons[i]), 1);
        }

        DebugLog(`Removed <b>${selectedAddons}</b> from <b>${KillerBalance[selectedKiller].Name}</b>`);
        DebugLog(selectedAddons);

        LoadKillerOverrideUI(selectedKiller);
    });

    // Get the Killer Confirm Tier Button
    var killerConfirmTierButton = document.getElementById("killer-tier-confirmation-button");
    var survivorConfirmTierButton = document.getElementById("survivor-tier-confirmation-button");

    killerConfirmTierButton.addEventListener("click", function() {
        // Get the tiers selected
        var selectedTiers = GetSelectValues(document.getElementById("killer-tier-selection-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;

        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the indexes of the tiers with the same name
        var tierIndexes = [];
        for (var i = 0; i < selectedTiers.length; i++) {
            for (var j = 0; j < Tiers.length; j++) {
                if (Tiers[j].Name == selectedTiers[i]) {
                    tierIndexes.push(j);
                    continue;
                }
            }
        }

        // Set the tierIndexes to the killer
        KillerBalance[killerIndex].BalanceTiers = tierIndexes;
    });

    survivorConfirmTierButton.addEventListener("click", function() {
        // Get the tiers selected
        var selectedTiers = GetSelectValues(document.getElementById("survivor-balance-tier-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;

        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the indexes of the tiers with the same name
        var tierIndexes = [];
        for (var i = 0; i < selectedTiers.length; i++) {
            for (var j = 0; j < Tiers.length; j++) {
                if (Tiers[j].Name == selectedTiers[i]) {
                    tierIndexes.push(j);
                    continue;
                }
            }
        }

        // Set the tierIndexes to the killer
        KillerBalance[killerIndex].SurvivorBalanceTiers = tierIndexes;
    });

    // Get the Killer Confirm Map Button
    var killerConfirmMapButton = document.getElementById("map-confirmation-button");

    killerConfirmMapButton.addEventListener("click", function() {
        // Get the maps selected
        var selectedMaps = GetSelectValues(document.getElementById("map-selection-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;

        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the indexes of the maps with the same name
        var mapIndexes = [];
        for (var i = 0; i < selectedMaps.length; i++) {
            for (var j = 0; j < Maps.length; j++) {
                if (Maps[j] == selectedMaps[i]) {
                    mapIndexes.push(j);
                    continue;
                }
            }
        }

        // Set the mapIndexes to the killer
        KillerBalance[killerIndex].Map = mapIndexes;

        DebugLog(`Map set to <b>${KillerBalance[killerIndex].Map}</b> for <b>${KillerBalance[killerIndex].Name}</b>`);
    });

    var killerConfirmOfferingButton = document.getElementById("killer-offering-confirmation-button");
    var survivorConfirmOfferingButton = document.getElementById("survivor-offering-confirmation-button");

    killerConfirmOfferingButton.addEventListener("click", function() {
        // Get the offerings selected
        var selectedOfferings = GetSelectValues(document.getElementById("killer-offering-selection-dropdown"));

        // Get the index of the killer with the same name
        var killerIndex = GetCurrentKillerIndex();
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the indexes of the offerings with the same name
        var offeringIndexes = [];
        for (var i = 0; i < selectedOfferings.length; i++) {
            for (var j = 0; j < Offerings.Killer.length; j++) {
                //DebugLog(`Comparing ${Offerings.Killer[j]} to ${selectedOfferings[i]}`)
                if (Offerings.Killer[j] == selectedOfferings[i]) {
                    offeringIndexes.push(j);
                    continue;
                }
            }
        }

        // Set the offeringIndexes to the killer
        KillerBalance[killerIndex].KillerOfferings = offeringIndexes;

        DebugLog(`Offering set to <b>${KillerBalance[killerIndex].KillerOfferings}</b> for <b>${KillerBalance[killerIndex].Name}</b>`
        , false);
    });

    survivorConfirmOfferingButton.addEventListener("click", function() {
        // Get the offerings selected
        var selectedOfferings = GetSelectValues(document.getElementById("survivor-offering-selection-dropdown"));

        // Get the index of the killer with the same name
        var killerIndex = GetCurrentKillerIndex();
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the indexes of the offerings with the same name
        var offeringIndexes = [];
        for (var i = 0; i < selectedOfferings.length; i++) {
            for (var j = 0; j < Offerings.Survivor.length; j++) {
                //DebugLog(`Comparing ${Offerings.Survivor[j]} to ${selectedOfferings[i]}`)
                if (Offerings.Survivor[j] == selectedOfferings[i]) {
                    offeringIndexes.push(j);
                    continue;
                }
            }
        }

        // Set the offeringIndexes to the killer
        KillerBalance[killerIndex].SurvivorOfferings = offeringIndexes;

        DebugLog(`Offering set to <b>${KillerBalance[killerIndex].SurvivorOfferings}</b> for <b>${KillerBalance[killerIndex].Name}</b>`,
        false);
    });

    // Set Killer Perk Ban Events
    SetKillerOverridePerkBanEvents();
}

function SetKillerOverridePerkBanEvents() {
    // Get the Killer Perk Ban Buttons
    var addKillerIndvPrkBanButton = document.getElementById("killer-tiered-individual-perk-ban-add-button");
    var addKillerComboPrkBanButton = document.getElementById("killer-tiered-combined-perk-ban-add-button");

    var removeKillerIndvPrkBanButton = document.getElementById("killer-tiered-individual-perk-ban-remove-button");
    var removeKillerComboPrkBanButton = document.getElementById("killer-tiered-combined-perk-ban-remove-button");

    // Get the Survivor Perk Ban Buttons
    var addSurvivorIndvPrkBanButton = document.getElementById("survivor-tiered-individual-perk-ban-add-button");
    var addSurvivorComboPrkBanButton = document.getElementById("survivor-tiered-combined-perk-ban-add-button");

    var removeSurvivorIndvPrkBanButton = document.getElementById("survivor-tiered-individual-perk-ban-remove-button");
    var removeSurvivorComboPrkBanButton = document.getElementById("survivor-tiered-combined-perk-ban-remove-button");

    // Get the Killer Perk Whitelist Buttons
    var addKillerIndvPrkWhitelistButton = document.getElementById("killer-tiered-individual-perk-whitelist-add-button");
    var addKillerComboPrkWhitelistButton = document.getElementById("killer-tiered-combined-perk-whitelist-add-button");

    var removeKillerIndvPrkWhitelistButton = document.getElementById("killer-tiered-individual-perk-whitelist-remove-button");
    var removeKillerComboPrkWhitelistButton = document.getElementById("killer-tiered-combined-perk-whitelist-remove-button");

    // Get the Survivor Perk Whitelist Buttons
    var addSurvivorIndvPrkWhitelistButton = document.getElementById("survivor-tiered-individual-perk-whitelist-add-button");
    var addSurvivorComboPrkWhitelistButton = document.getElementById("survivor-tiered-combined-perk-whitelist-add-button");

    var removeSurvivorIndvPrkWhitelistButton = document.getElementById("survivor-tiered-individual-perk-whitelist-remove-button");
    var removeSurvivorComboPrkWhitelistButton = document.getElementById("survivor-tiered-combined-perk-whitelist-remove-button");

    // Add On Click Events
    addKillerIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Add the perks to the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            if (Perks[selectedPerks[i]].survivorPerk) { continue; }
            KillerBalance[killerIndex].KillerIndvPerkBans.push(selectedPerks[i]);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    addKillerComboPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        var ComboObj = [];
        // Create the perk combo, then add it to the killer
        if (selectedPerks.length < 2) { console.error("Not enough perks selected!"); return; }
        if (selectedPerks.length > 4) { console.error("Too many perks selected!"); return; }

        for (var i = 0; i < selectedPerks.length; i++) {
            if (Perks[selectedPerks[i]].survivorPerk) { continue; }

            ComboObj.push(selectedPerks[i]);
        }
        DebugLog(ComboObj)
        KillerBalance[killerIndex].KillerComboPerkBans.push(ComboObj);
        DebugLog(KillerBalance[killerIndex]);

        LoadKillerOverrideUI(killerIndex);
    });

    addSurvivorIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Add the perks to the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            if (!Perks[selectedPerks[i]].survivorPerk) { continue; }
            KillerBalance[killerIndex].SurvivorIndvPerkBans.push(selectedPerks[i]);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    addSurvivorComboPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        var ComboObj = [];
        // Create the perk combo, then add it to the killer
        if (selectedPerks.length < 2) { console.error("Not enough perks selected!"); return; }
        if (selectedPerks.length > 4) { console.error("Too many perks selected!"); return; }

        for (var i = 0; i < selectedPerks.length; i++) {
            if (!Perks[selectedPerks[i]].survivorPerk) { continue; }

            ComboObj.push(selectedPerks[i]);
        }
        DebugLog(ComboObj)
        KillerBalance[killerIndex].SurvivorComboPerkBans.push(ComboObj);
        DebugLog(KillerBalance[killerIndex]);

        LoadKillerOverrideUI(killerIndex);
    });

    addKillerIndvPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Add the perks to the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            if (Perks[selectedPerks[i]].survivorPerk) { continue; }
            KillerBalance[killerIndex].KillerWhitelistedPerks.push(selectedPerks[i]);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    addKillerComboPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        var ComboObj = [];
        // Create the perk combo, then add it to the killer
        if (selectedPerks.length < 2) { console.error("Not enough perks selected!"); return; }
        if (selectedPerks.length > 4) { console.error("Too many perks selected!"); return; }

        for (var i = 0; i < selectedPerks.length; i++) {
            if (Perks[selectedPerks[i]].survivorPerk) { continue; }

            ComboObj.push(selectedPerks[i]);
        }
        DebugLog(ComboObj)
        KillerBalance[killerIndex].KillerWhitelistedComboPerks.push(ComboObj);
        DebugLog(KillerBalance[killerIndex]);

        LoadKillerOverrideUI(killerIndex);
    });

    addSurvivorIndvPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Add the perks to the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            if (!Perks[selectedPerks[i]].survivorPerk) { continue; }
            KillerBalance[killerIndex].SurvivorWhitelistedPerks.push(selectedPerks[i]);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    addSurvivorComboPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        var ComboObj = [];
        // Create the perk combo, then add it to the killer
        if (selectedPerks.length < 2) { console.error("Not enough perks selected!"); return; }
        if (selectedPerks.length > 4) { console.error("Too many perks selected!"); return; }

        for (var i = 0; i < selectedPerks.length; i++) {
            if (!Perks[selectedPerks[i]].survivorPerk) { continue; }

            ComboObj.push(selectedPerks[i]);
        }
        DebugLog(ComboObj)
        KillerBalance[killerIndex].SurvivorWhitelistedComboPerks.push(ComboObj);
        DebugLog(KillerBalance[killerIndex]);

        LoadKillerOverrideUI(killerIndex);
    });

    // Remove On Click Events
    removeKillerIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("killer-tiered-individual-perk-ban-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].KillerIndvPerkBans.splice(KillerBalance[killerIndex].KillerIndvPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeKillerComboPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("killer-tiered-combined-perk-ban-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].KillerComboPerkBans.splice(KillerBalance[killerIndex].KillerComboPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeSurvivorIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("survivor-tiered-individual-perk-ban-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].SurvivorIndvPerkBans.splice(KillerBalance[killerIndex].SurvivorIndvPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeSurvivorComboPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("survivor-tiered-combined-perk-ban-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].SurvivorComboPerkBans.splice(KillerBalance[killerIndex].SurvivorComboPerkBans.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeKillerIndvPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("killer-tiered-individual-perk-whitelist-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < KillerBalance.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].KillerWhitelistedPerks.splice(KillerBalance[killerIndex].KillerWhitelistedPerks.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeKillerComboPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("killer-tiered-combined-perk-whitelist-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;

        for (var i = 0; i < KillerBalance.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].KillerWhitelistedComboPerks.splice(KillerBalance[killerIndex].KillerWhitelistedComboPerks.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeSurvivorIndvPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("survivor-tiered-individual-perk-whitelist-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name

        var killerIndex = -1;
        for (var i = 0; i < KillerBalance.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].SurvivorWhitelistedPerks.splice(KillerBalance[killerIndex].SurvivorWhitelistedPerks.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });

    removeSurvivorComboPrkWhitelistButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("survivor-tiered-combined-perk-whitelist-dropdown"));

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name

        var killerIndex = -1;
        for (var i = 0; i < KillerBalance.length; i++) {
            if (Killers[i] == selectedKiller) {
                killerIndex = i;
                continue;
            }
        }

        // Remove the perks from the killer
        for (var i = 0; i < selectedPerks.length; i++) {
            KillerBalance[killerIndex].SurvivorWhitelistedComboPerks.splice(KillerBalance[killerIndex].SurvivorWhitelistedComboPerks.indexOf(selectedPerks[i]), 1);
        }

        LoadKillerOverrideUI(killerIndex);
    });
}

function LoadKillerOverrideUIByName(name) {

    // Get the index of the killer with the same name
    var killerIndex = -1;
    for (var i = 0; i < Killers.length; i++) {
        if (Killers[i] == name) {
            killerIndex = i;
            continue;
        }
    }
    if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

    LoadKillerOverrideUI(killerIndex);
}

function LoadKillerOverrideUI(id) {

    KillerData = KillerBalance[id];
    
    // Guard clause to make sure the killer data is valid.
    if (KillerData == undefined) {
        console.error("Killer balance data or Killer does not exist!");
        return;
    }
    
    // Once we know killer data is legit, we can apply it to frontend.
    
    DebugLog(`Loading balance data for Killer <b>${KillerBalance[id].Name}</b>`);
    
    // Load Anti-Facecamp Checkbox
    var antiFacecampCheckbox = document.getElementById("killer-antifacecamp-checkbox");
    antiFacecampCheckbox.checked = KillerData.AntiFacecampPermitted;

    // Load Selected Tiers
    DeselectAllValuesInListbox("killer-tier-selection-dropdown");
    DeselectAllValuesInListbox("survivor-balance-tier-dropdown");

    SelectValuesInListbox("killer-tier-selection-dropdown", KillerData.BalanceTiers);
    SelectValuesInListbox("survivor-balance-tier-dropdown", KillerData.SurvivorBalanceTiers);

    // Load Map Selection
    DeselectAllValuesInListbox("map-selection-dropdown");
    
    SelectValuesInListbox("map-selection-dropdown", KillerData.Map);

    // Load Selected Offerings
    // Deselect all options first

    DeselectAllValuesInListbox("killer-offering-selection-dropdown");
    SelectValuesInListbox("killer-offering-selection-dropdown", KillerData.KillerOfferings);
    
    DeselectAllValuesInListbox("survivor-offering-selection-dropdown");
    SelectValuesInListbox("survivor-offering-selection-dropdown", KillerData.SurvivorOfferings);

    // Load Killer Addons
    var addonDropdown = document.getElementById("killer-individual-addon-ban-dropdown");
    addonDropdown.innerHTML = "";

    CurrentKiller = GetCurrentKillerIndex();
    AddonCheckboxBanIDList = [
        "killer-addon-ban-checkbox-common",
        "killer-addon-ban-checkbox-uncommon",
        "killer-addon-ban-checkbox-rare",
        "killer-addon-ban-checkbox-veryrare",
        "killer-addon-ban-checkbox-iridescent"
    ]
    
    // Check appropriate ban checkboxes
    for (var i = 0; i < AddonCheckboxBanIDList.length; i++) {
        var currentCheckbox = document.getElementById(AddonCheckboxBanIDList[i]);
        //DebugLog(`\tChecking checkbox ${AddonCheckboxBanIDList[i]} for ${KillerBalance[CurrentKiller].Name}`)
        currentCheckbox.checked = KillerBalance[CurrentKiller].AddonTiersBanned.includes(i);
        //DebugLog(`\t\tDoes ${KillerBalance[CurrentKiller].Name} have ${i} in their ban list? ${KillerBalance[CurrentKiller].AddonTiersBanned.includes(i)}`)
    }

    DebugLog(Addons[CurrentKiller]);
    for (var i = 0; i < Addons[CurrentKiller].Addons.length; i++) {
        var currentCheckbox = document.getElementById(AddonCheckboxBanIDList[i]);

        if (currentCheckbox.checked) { continue; }

        //DebugLog("Current Addons:");
        //DebugLog(Addons[CurrentKiller].Addons);

        CurrentAddonList = Addons[CurrentKiller].Addons[i].Addons;
        //DebugLog(CurrentAddonList);
        for (var j = 0; j < CurrentAddonList.length; j++) {
            var optionsElement = document.createElement("option");
            optionsElement.value = CurrentAddonList[j];
            optionsElement.innerHTML = CurrentAddonList[j];
            optionsElement.style.backgroundColor = TIER_RARITY_COLOURLIST[i];
            optionsElement.style.color = "white";
            optionsElement.style.fontWeight = 700;
            optionsElement.style.textShadow = "0px 0px 5px black";
            optionsElement.style.textAlign = "center";
            optionsElement.style.border = "1px solid black";
            optionsElement.style.padding = "5px";
            //DebugLog(`Added Addon ${CurrentAddonList[j]} to ${KillerBalance[CurrentKiller].Name}`);
            addonDropdown.appendChild(optionsElement);
        }
    }

    addonDropdown = document.getElementById("killer-individual-addon-confirmed-bans-dropdown");
    addonDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.IndividualAddonBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.IndividualAddonBans[i];
        optionsElement.innerHTML = KillerData.IndividualAddonBans[i];
        
        // Get the rarity of the addon
        var addonRarity = 0;
        for (var j = 0; j < Addons[CurrentKiller].Addons.length; j++) {
            if (Addons[CurrentKiller].Addons[j].Addons.includes(KillerData.IndividualAddonBans[i])) {
                addonRarity = j;
                break;
            }
        }
        optionsElement.style.backgroundColor = TIER_RARITY_COLOURLIST[addonRarity];

        optionsElement.style.color = "white";
        optionsElement.style.fontWeight = 700;
        optionsElement.style.textShadow = "0px 0px 5px black";
        optionsElement.style.textAlign = "center";
        optionsElement.style.border = "1px solid black";
        optionsElement.style.padding = "5px";
        addonDropdown.appendChild(optionsElement);
    }

    // Load Killer Offerings Allowed
    var offeringDropdown = document.getElementById("killer-offering-selection-dropdown");
    var offeringsAllowed = KillerData.KillerOfferings;

    SelectValuesInListbox("killer-offering-selection-dropdown", offeringsAllowed);

    // Load Survivor Offerings Allowed
    offeringDropdown = document.getElementById("survivor-offering-selection-dropdown");
    offeringsAllowed = KillerData.SurvivorOfferings;

    SelectValuesInListbox("survivor-offering-selection-dropdown", offeringsAllowed);
    
    // Apply it to KillerIndvBanDropdown
    var KlrIndvPrkBanDropdown = document.getElementById("killer-tiered-individual-perk-ban-dropdown");
    KlrIndvPrkBanDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.KillerIndvPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.KillerIndvPerkBans[i];
        optionsElement.innerHTML = Perks[KillerData.KillerIndvPerkBans[i]].name;
        KlrIndvPrkBanDropdown.appendChild(optionsElement);
    }

    // Apply it to KlrComboBanDropdown
    var KlrComboBanDropdown = document.getElementById("killer-tiered-combined-perk-ban-dropdown");
    KlrComboBanDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.KillerComboPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.KillerComboPerkBans[i];

        // Get the string representation of the perk combo
        var comboString = "";
        for (var j = 0; j < KillerData.KillerComboPerkBans[i].length; j++) {
            comboString += Perks[KillerData.KillerComboPerkBans[i][j]].name;
            if (j != KillerData.KillerComboPerkBans[i].length - 1) {
                comboString += " + ";
            }
        }
        optionsElement.innerHTML = comboString;
        KlrComboBanDropdown.appendChild(optionsElement);
    }

    // Apply it to KillerIndvWhitelistDropdown
    var KlrIndvPrkWhitelistDropdown = document.getElementById("killer-tiered-individual-perk-whitelist-dropdown");
    KlrIndvPrkWhitelistDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.KillerWhitelistedPerks.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.KillerWhitelistedPerks[i];
        optionsElement.innerHTML = Perks[KillerData.KillerWhitelistedPerks[i]].name;
        KlrIndvPrkWhitelistDropdown.appendChild(optionsElement);
    }

    // Apply it to KlrComboWhitelistDropdown
    var KlrComboWhitelistDropdown = document.getElementById("killer-tiered-combined-perk-whitelist-dropdown");
    KlrComboWhitelistDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.KillerWhitelistedComboPerks.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.KillerWhitelistedComboPerks[i];

        // Get the string representation of the perk combo
        var comboString = "";
        for (var j = 0; j < KillerData.KillerWhitelistedComboPerks[i].length; j++) {
            comboString += Perks[KillerData.KillerWhitelistedComboPerks[i][j]].name;
            if (j != KillerData.KillerWhitelistedComboPerks[i].length - 1) {
                comboString += " + ";
            }
        }
        optionsElement.innerHTML = comboString;
        KlrComboWhitelistDropdown.appendChild(optionsElement);
    }

    // Apply it to SurvivorIndvBanDropdown
    var SrvIndvPrkBanDropdown = document.getElementById("survivor-tiered-individual-perk-ban-dropdown");
    SrvIndvPrkBanDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.SurvivorIndvPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.SurvivorIndvPerkBans[i];
        optionsElement.innerHTML = Perks[KillerData.SurvivorIndvPerkBans[i]].name;
        SrvIndvPrkBanDropdown.appendChild(optionsElement);
    }

    // Apply it to SurvComboBanDropdown
    var SrvComboBanDropdown = document.getElementById("survivor-tiered-combined-perk-ban-dropdown");
    SrvComboBanDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.SurvivorComboPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.SurvivorComboPerkBans[i];

        // Get the string representation of the perk combo
        var comboString = "";
        for (var j = 0; j < KillerData.SurvivorComboPerkBans[i].length; j++) {
            comboString += Perks[KillerData.SurvivorComboPerkBans[i][j]].name;
            if (j != KillerData.SurvivorComboPerkBans[i].length - 1) {
                comboString += " + ";
            }
        }
        optionsElement.innerHTML = comboString;
        SrvComboBanDropdown.appendChild(optionsElement);
    }

    // Apply it to SurvivorIndvWhitelistDropdown
    var SrvIndvPrkWhitelistDropdown = document.getElementById("survivor-tiered-individual-perk-whitelist-dropdown");
    SrvIndvPrkWhitelistDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.SurvivorWhitelistedPerks.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.SurvivorWhitelistedPerks[i];
        optionsElement.innerHTML = Perks[KillerData.SurvivorWhitelistedPerks[i]].name;
        SrvIndvPrkWhitelistDropdown.appendChild(optionsElement);
    }

    // Apply it to SrvComboWhitelistDropdown
    var SrvComboWhitelistDropdown = document.getElementById("survivor-tiered-combined-perk-whitelist-dropdown");
    SrvComboWhitelistDropdown.innerHTML = "";

    for (var i = 0; i < KillerData.SurvivorWhitelistedComboPerks.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = KillerData.SurvivorWhitelistedComboPerks[i];

        // Get the string representation of the perk combo
        var comboString = "";
        for (var j = 0; j < KillerData.SurvivorWhitelistedComboPerks[i].length; j++) {
            comboString += Perks[KillerData.SurvivorWhitelistedComboPerks[i][j]].name;
            if (j != KillerData.SurvivorWhitelistedComboPerks[i].length - 1) {
                comboString += " + ";
            }
        }
        optionsElement.innerHTML = comboString;
        SrvComboWhitelistDropdown.appendChild(optionsElement);
    }

    return "OK!";
}

// Code from RobG as of 05/03/2011 on StackOverflow
// https://stackoverflow.com/questions/5866169/how-to-get-all-selected-values-of-a-multiple-select-box
// Return an array of the selected option values
// select is an HTML select element
function GetSelectValues(select) {
    var result = [];
    var options = select && select.options;
    var opt;
  
    for (var i=0, iLen=options.length; i<iLen; i++) {
      opt = options[i];
  
      if (opt.selected) {
        result.push(opt.value || opt.text);
      }
    }
    return result;
  }

function SetKillerBalancing() {
    // Loop through all killers
    for (var i = 0; i < Killers.length; i++) {
        NewKillerBalance = CreateKillerOverride(Killers[i]);
        KillerBalance.push(NewKillerBalance);
    }
}

/**
 * Creates a new killer override
 * @param {string} name The name of the Killer object
 * @returns {object} The killer balancing
 */
function CreateKillerOverride(name) {
    NewKillerBalance = {
        Name: name,
        Map: [0], // Can be empty, which means all maps are allowed.
        BalanceTiers: [0], //Set to 0 for General Tier, which is always created.
        SurvivorBalanceTiers: [0], // Set to 0 for General Tier, which is always created.
        AntiFacecampPermitted: false, // Whether or not the anti-facecamping feature is permitted.
        KillerIndvPerkBans: [], // e.g. Noed, BBQ, etc.
        KillerComboPerkBans: [], // e.g. Noed + BBQ, etc.
        SurvivorIndvPerkBans: [], // e.g. DS, Unbreakable, etc.
        SurvivorComboPerkBans: [], // e.g. DS + Unbreakable, etc.
        SurvivorWhitelistedPerks: [], // e.g. Skull Merchant sucks ass so we need to give people Potential Energy so games aren't slogs...
        SurvivorWhitelistedComboPerks: [], // In the case some perk combo deserves to be whitelisted for a particular Killer.
        KillerWhitelistedPerks: [], // If some Killer benefits particularly off of a perk.
        KillerWhitelistedComboPerks: [], // If some Killer benefits particularly off of a perk combo.
        AddonTiersBanned: [], // 0=Common | 1=Uncommon | 2=Rare | 3=Very Rare | 4=Iridescent
        IndividualAddonBans: [], // Name of the addons that are banned.
        SurvivorOfferings: [],  // Name of the permitted survivor offerings
        KillerOfferings: [] // Name of the permitted killer offerings
    }

    return NewKillerBalance;
}

function LoadTierByName(name) {
    // Get the index of the tier with the same name
    for (var i = 0; i < Tiers.length; i++) {
        if (Tiers[i].Name == name) {
            LoadTier(i);
            return;
        }
    }
    return undefined;
}

function LoadTier(id) {
    TierData = Tiers[id];

    // Guard clause to make sure you're only loading valid tiers.
    if (TierData == undefined) {
        console.error("Tier does not exist!");
        return;
    }
    
    // Once we know tier data is legit, we can apply it to frontend.

    // Apply it to SurvIndvBanDropdown
    var SrvIndvPrkBanDropdown = document.getElementById("survivor-individual-perk-ban-dropdown");
    SrvIndvPrkBanDropdown.innerHTML = "";

    for (var i = 0; i < TierData.SurvivorIndvPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = TierData.SurvivorIndvPerkBans[i];
        optionsElement.innerHTML = Perks[TierData.SurvivorIndvPerkBans[i]].name;
        SrvIndvPrkBanDropdown.appendChild(optionsElement);
    }

    // Apply it to SurvComboBanDropdown
    var SrvComboBanDropdown = document.getElementById("survivor-combined-perk-ban-dropdown");
    SrvComboBanDropdown.innerHTML = "";

    for (var i = 0; i < TierData.SurvivorComboPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = TierData.SurvivorComboPerkBans[i];

        // Get the string representation of the perk combo
        var comboString = "";
        for (var j = 0; j < TierData.SurvivorComboPerkBans[i].length; j++) {
            comboString += Perks[TierData.SurvivorComboPerkBans[i][j]].name;
            if (j != TierData.SurvivorComboPerkBans[i].length - 1) {
                comboString += " + ";
            }
        }
        optionsElement.innerHTML = comboString;
        SrvComboBanDropdown.appendChild(optionsElement);
    }

    // Apply it to KillerIndvBanDropdown
    var KlrIndvPrkBanDropdown = document.getElementById("killer-individual-perk-ban-dropdown");
    KlrIndvPrkBanDropdown.innerHTML = "";

    for (var i = 0; i < TierData.KillerIndvPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = TierData.KillerIndvPerkBans[i];
        optionsElement.innerHTML = Perks[TierData.KillerIndvPerkBans[i]].name;
        KlrIndvPrkBanDropdown.appendChild(optionsElement);
    }

    // Apply it to KlrComboBanDropdown
    var KlrComboBanDropdown = document.getElementById("killer-combined-perk-ban-dropdown");
    KlrComboBanDropdown.innerHTML = "";

    for (var i = 0; i < TierData.KillerComboPerkBans.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = TierData.KillerComboPerkBans[i];

        // Get the string representation of the perk combo
        var comboString = "";
        for (var j = 0; j < TierData.KillerComboPerkBans[i].length; j++) {
            comboString += Perks[TierData.KillerComboPerkBans[i][j]].name;
            if (j != TierData.KillerComboPerkBans[i].length - 1) {
                comboString += " + ";
            }
        }
        optionsElement.innerHTML = comboString;
        KlrComboBanDropdown.appendChild(optionsElement);
    }

    return "OK!";
}

function UpdateDropdowns() {
    // Update the perk repetition dropdown
    var perkRepetitionDropdown = document.getElementById("maximum-perk-repetition-dropdown");
    perkRepetitionDropdown.value = MaximumPerkRepetition;

    // Update Tiers Dropdowns
    UpdateTierDropdowns();

    // Update Killer Dropdowns
    UpdateKillerDropdowns();

    // Update Map Dropdowns
    UpdateMapDropdowns();
}

function SetTierEvents() {
    var tierCreateButton = document.getElementById("tier-creation-button");

    tierCreateButton.addEventListener("click", function() {
        var tierName = document.getElementById("tier-creation-textbox").value
        Tiers.push(CreateTier(tierName));
        UpdateDropdowns();
    });
}

function UpdateTierDropdowns() {
    var tierDropdown = document.getElementById("tier-selection-dropdown");
    var killerTierDropdown = document.getElementById("killer-tier-selection-dropdown");
    var survivorTierDropdown = document.getElementById("survivor-balance-tier-dropdown");

    tierDropdown.innerHTML = "";
    killerTierDropdown.innerHTML = "";
    survivorTierDropdown.innerHTML = "";

    for (var i = 0; i < Tiers.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Tiers[i].Name;
        optionsElement.innerHTML = Tiers[i].Name;
        tierDropdown.appendChild(optionsElement);

        optionsElement = document.createElement("option");
        optionsElement.value = Tiers[i].Name;
        optionsElement.innerHTML = Tiers[i].Name;
        killerTierDropdown.appendChild(optionsElement);

        optionsElement = document.createElement("option");
        optionsElement.value = Tiers[i].Name;
        optionsElement.innerHTML = Tiers[i].Name;
        survivorTierDropdown.appendChild(optionsElement);
    }
}

function UpdateKillerDropdowns() {
    var killerDropdown = document.getElementById("killer-selection-dropdown");
    killerDropdown.innerHTML = "";

    for (var i = 0; i < Killers.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Killers[i];
        optionsElement.innerHTML = Killers[i];
        killerDropdown.appendChild(optionsElement);
    }


    var killerOfferingDropdown = document.getElementById("killer-offering-selection-dropdown");
    killerOfferingDropdown.innerHTML = "";

    for (var i = 0; i < Offerings.Killer.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Offerings.Killer[i];
        optionsElement.innerHTML = Offerings.Killer[i];
        killerOfferingDropdown.appendChild(optionsElement);
    }

    var survivorOfferingDropdown = document.getElementById("survivor-offering-selection-dropdown");
    survivorOfferingDropdown.innerHTML = "";

    for (var i = 0; i < Offerings.Survivor.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Offerings.Survivor[i];
        optionsElement.innerHTML = Offerings.Survivor[i];
        survivorOfferingDropdown.appendChild(optionsElement);
    }
}

function UpdateMapDropdowns() {
    var mapDropdown = document.getElementById("map-selection-dropdown");

    mapDropdown.innerHTML = "";

    for (var i = 0; i < Maps.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Maps[i];
        optionsElement.innerHTML = Maps[i];
        mapDropdown.appendChild(optionsElement);
    }
}

function CreateTier(name) {
    var NewTier = {
        Name: name,
        SurvivorIndvPerkBans: [],
        KillerIndvPerkBans: [],
        SurvivorComboPerkBans: [],
        KillerComboPerkBans: [],
    }
    return NewTier;
}

function SetSearchEvents() {
    var searchButton = document.getElementById("perk-search-button");

    searchButton.addEventListener("click", function() {
        var query = document.getElementById("perk-search-textbox").value;
        var isSurvivor = document.getElementById("perk-search-role-checkbox").checked;

        OverrideButtonSearch(query, isSurvivor);
    });
}

function OverrideButtonSearch(query, isSurvivor) {
    var searchResults = SearchForPerks(query, isSurvivor);

    
    var searchResultsContainer = document.getElementById("perk-search-results");
    selectedPerks = GetSelectValues(searchResultsContainer);

    searchResultsContainer.innerHTML = "";

    for (var i = 0; i < selectedPerks.length; i++) { 
        var optionsElement = document.createElement("option");
        optionsElement.value = selectedPerks[i];
        optionsElement.innerHTML = Perks[selectedPerks[i]].name;
        optionsElement.style.backgroundImage = "url(" + Perks[selectedPerks[i]].icon + ")";
        optionsElement.style.backgroundSize = "contain";
        optionsElement.style.backgroundRepeat = "no-repeat";
        optionsElement.style.backgroundPosition = "right";
        searchResultsContainer.appendChild(optionsElement);
    }

    for (var i = 0; i < searchResults.length; i++) {
        // Get the values from the search container
        var allOptionsInSearch = searchResultsContainer.options;
        // Check if the perk is already in the search container
        var alreadyInSearch = false;
        for (var j = 0; j < allOptionsInSearch.length; j++) {
            if (allOptionsInSearch[j].value == searchResults[i].id) {
                alreadyInSearch = true;
                break;
            }
        }
        if (alreadyInSearch) { continue; }

        var optionsElement = document.createElement("option");
        optionsElement.value = searchResults[i].id;

        optionsElement.innerHTML = searchResults[i].name;
        //optionsElement.style.backgroundImage = "url(" + searchResults[i].icon + ")";
        optionsElement.style.backgroundSize = "contain";
        optionsElement.style.backgroundRepeat = "no-repeat";
        optionsElement.style.backgroundPosition = "right";
        searchResultsContainer.appendChild(optionsElement);
    }
}

function GetPerks() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Perks = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting perks: " + this.status);
            }
            GetKillers();
        }
    }
    xhttp.open("GET", "Perks/dbdperks.json", false);
    xhttp.send();
}

function GetKillers() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Killers = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting killers: " + this.status);
            }
            GetSurvivors();
        }
    }
    xhttp.open("GET", "Killers.json", false);
    xhttp.send();
}

function GetSurvivors() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Survivors = JSON.parse(this.responseText);
                    
                break;
                default:
                    console.error("Error getting survivors: " + this.status);
            
            }
            GetMaps();
        }
    }
    xhttp.open("GET", "Survivors.json", false);
    xhttp.send();
}

function GetMaps() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Maps = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting maps: " + this.status);
            }
            GetAddons();
        }
    }
    xhttp.open("GET", "Maps.json", false);
    xhttp.send();
}

function GetAddons() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Addons = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting addons: " + this.status);
            }
            GetOfferings();
        }
    }
    xhttp.open("GET", "Addons.json", false);
    xhttp.send();
}

function GetOfferings() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Offerings = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting offerings: " + this.status);
            }
            AllDataLoaded = true;
        }
    }
    xhttp.open("GET", "Offerings.json", false);
    xhttp.send();
}

// Button Events
function SearchForPerks(searchQuery, isSurvivor) {
    var searchResults = [];

    for (var i = 0; i < Perks.length; i++) {
        if (Perks[i].name.toLowerCase().includes(searchQuery.toLowerCase())) {
            if (Perks[i].survivorPerk == isSurvivor) {
                searchResults.push(Perks[i]);
            }
        }
    }

    return searchResults;   
}

/**
 * Exports the balancing to a JSON string.
 * 
 * Goes property by property to ensure that if something is added to the balancing, it won't break the export.
 * @returns {void}
 */
function ExportBalancing() {

    // Validate the killer balance
    KillerValidityErrors = [];
    for (var i = 0; i < KillerBalance.length; i++) {
        var validation = ValidateKillerBalance(i);
        if (!validation[0]) {
            KillerValidityErrors.push(validation[1]);
        }
    }

    if (KillerValidityErrors.length > 0) {
        alert("Killer balance is invalid! Please fix the following errors:\n\n" + KillerValidityErrors.join("\n"));
        return;
    }

    maxPerkRepetition = document.getElementById("maximum-perk-repetition-dropdown").value;
    // Convert maxPerkRepetition to an integer
    maxPerkRepetition = parseInt(maxPerkRepetition);

    NewTierExport = [];
    for (var i = 0; i < Tiers.length; i++) {
        NewTier = CreateTier(Tiers[i].Name);

        NewTier.SurvivorIndvPerkBans = Tiers[i].SurvivorIndvPerkBans;
        NewTier.SurvivorComboPerkBans = Tiers[i].SurvivorComboPerkBans;
        NewTier.KillerIndvPerkBans = Tiers[i].KillerIndvPerkBans;
        NewTier.KillerComboPerkBans = Tiers[i].KillerComboPerkBans;

        NewTierExport.push(NewTier);
    }

    NewKillerExport = [];
    for (var i = 0; i < KillerBalance.length; i++) {
        NewKiller = CreateKillerOverride(KillerBalance[i].Name);
        DebugLog(KillerBalance[i]);

        NewKiller.Map = KillerBalance[i].Map;
        NewKiller.BalanceTiers = KillerBalance[i].BalanceTiers;
        NewKiller.SurvivorBalanceTiers = KillerBalance[i].SurvivorBalanceTiers;
        NewKiller.AntiFacecampPermitted = KillerBalance[i].AntiFacecampPermitted;
        NewKiller.KillerIndvPerkBans = KillerBalance[i].KillerIndvPerkBans;
        NewKiller.KillerComboPerkBans = KillerBalance[i].KillerComboPerkBans;
        NewKiller.SurvivorIndvPerkBans = KillerBalance[i].SurvivorIndvPerkBans;
        NewKiller.SurvivorComboPerkBans = KillerBalance[i].SurvivorComboPerkBans;
        NewKiller.SurvivorWhitelistedPerks = KillerBalance[i].SurvivorWhitelistedPerks;
        NewKiller.SurvivorWhitelistedComboPerks = KillerBalance[i].SurvivorWhitelistedComboPerks;
        NewKiller.KillerWhitelistedPerks = KillerBalance[i].KillerWhitelistedPerks;
        NewKiller.KillerWhitelistedComboPerks = KillerBalance[i].KillerWhitelistedComboPerks;
        NewKiller.AddonTiersBanned = KillerBalance[i].AddonTiersBanned;
        NewKiller.IndividualAddonBans = KillerBalance[i].IndividualAddonBans;
        NewKiller.SurvivorOfferings = KillerBalance[i].SurvivorOfferings;
        NewKiller.KillerOfferings = KillerBalance[i].KillerOfferings;

        NewKillerExport.push(NewKiller);
    }

    var FinalBalanceObj = {
        Name: document.getElementById("balance-name-textbox").value,
        Version: version,
        MaxPerkRepetition: maxPerkRepetition,
        Tiers: NewTierExport,
        KillerOverride: NewKillerExport
    }

    var balanceExportBox = document.getElementById("balance-export-textbox");
    balanceExportBox.value = JSON.stringify(FinalBalanceObj);
}

/**
 * Validate the balance of a killer's data and return a boolean.
 * @param {*} id The id of the killer to validate.
 * @returns {Array} First argument is a boolean representing if the killer's data is valid. Second argument is a string representing the error message (otherwise "OK" is returned).
 */ 
function ValidateKillerBalance(id) { 
    // Get the killer's data
    var killerData = KillerBalance[id];

    // Check if the killer's data is valid
    if (killerData == undefined) {
        console.error(`Killer data for ${Killers[id]} is undefined!`);
        return [false, `Killer data for ${Killers[id]} is undefined!`];
    }

    // Check if the killer has a map assigned
    if (killerData.Map == undefined) { 
        console.error(`Map for ${killerData.Name} is undefined!`);
        return [false, `Map for ${killerData.Name} is undefined!`];
    }
    if (killerData.Map.length <= 0) {
        console.error(`Map for ${killerData.Name} is empty!`);
        return [false, `Map for ${killerData.Name} is empty! Please assign a map!`];
    }

    return [true, "OK"];
}

/**
 * Import a balancing from a JSON string.
 * 
 * Goes property by property to ensure that if something is added to the balancing, it won't break the import.
 */
function ImportBalancing() {
    var balanceImportBox = document.getElementById("balance-import-textbox");
    var balanceImportObj = JSON.parse(balanceImportBox.value);

    document.getElementById("balance-name-textbox").value = balanceImportObj.Name;
    KillerBalance = balanceImportObj.KillerOverride;

    Tiers = [];
    
    for (var i = 0; i < balanceImportObj.Tiers.length; i++) {
        curTier = balanceImportObj.Tiers[i];
        
        // Check if the tier is valid
        if (curTier == undefined) {
            console.error(`Tier is undefined!`);
            continue;
        }

        NewTier = CreateTier(curTier.Name);

        NewTier.SurvivorIndvPerkBans = curTier.SurvivorIndvPerkBans;
        NewTier.SurvivorComboPerkBans = curTier.SurvivorComboPerkBans;
        NewTier.KillerIndvPerkBans = curTier.KillerIndvPerkBans;
        NewTier.KillerComboPerkBans = curTier.KillerComboPerkBans;

        Tiers.push(NewTier);
    }

    KillerBalance = [];
    for (var i = 0; i < balanceImportObj.KillerOverride.length; i++) {
        var curKiller = balanceImportObj.KillerOverride[i];

        // Check if the killer is valid
        if (curKiller == undefined) {
            console.error(`Killer is undefined!`);
            continue;
        }

        NewKillerBalance = CreateKillerOverride(curKiller.Name);

        NewKillerBalance.Map = curKiller.Map;
        NewKillerBalance.BalanceTiers = curKiller.BalanceTiers;
        NewKillerBalance.SurvivorBalanceTiers = curKiller.SurvivorBalanceTiers;
        NewKillerBalance.AntiFacecampPermitted = curKiller.AntiFacecampPermitted;
        NewKillerBalance.KillerIndvPerkBans = curKiller.KillerIndvPerkBans;
        NewKillerBalance.KillerComboPerkBans = curKiller.KillerComboPerkBans;
        NewKillerBalance.SurvivorIndvPerkBans = curKiller.SurvivorIndvPerkBans;
        NewKillerBalance.SurvivorComboPerkBans = curKiller.SurvivorComboPerkBans;
        NewKillerBalance.SurvivorWhitelistedPerks = curKiller.SurvivorWhitelistedPerks;
        NewKillerBalance.SurvivorWhitelistedComboPerks = curKiller.SurvivorWhitelistedComboPerks;
        NewKillerBalance.KillerWhitelistedPerks = curKiller.KillerWhitelistedPerks;
        NewKillerBalance.KillerWhitelistedComboPerks = curKiller.KillerWhitelistedComboPerks;
        NewKillerBalance.AddonTiersBanned = curKiller.AddonTiersBanned;
        NewKillerBalance.IndividualAddonBans = curKiller.IndividualAddonBans;
        NewKillerBalance.SurvivorOfferings = curKiller.SurvivorOfferings;
        NewKillerBalance.KillerOfferings = curKiller.KillerOfferings;

        KillerBalance.push(NewKillerBalance);
    }

    UpdateDropdowns();
    LoadTier(0);
    LoadKillerOverrideUI(0);
}

/* HELPER FUNCTIONS */

/**
 * Returns the name of the currently selected killer.
 * @returns {String} The name of the currently selected killer.
 */
function GetCurrentKiller() {
    return document.getElementById("killer-selection-dropdown").value;
}

/**
 * Returns the index of the currently selected killer.
 * @returns {Number} The index of the currently selected killer.
 */
function GetCurrentKillerIndex() {
    var killerName = GetCurrentKiller();
    for (var i = 0; i < Killers.length; i++) {
        if (Killers[i] == killerName) {
            return i;
        }
    }
    return -1;
}

/**
 * Returns the name of the currently selected balance tier.
 * @returns {String} The name of the currently selected balance tier.
 */
function GetCurrentTier() {
    return document.getElementById("tier-selection-dropdown").value;
}

function SelectValuesInListbox(id, values) {
    DebugLog(`Selecting values ${values} in listbox ${id}`);

    try {
        // Select the options based on values
        const selectOptions = document.getElementById(id).options;
        for (const index of values) {
            selectOptions[index].selected = true;
        }
    } catch (error) {
        console.error(`Error selecting values in listbox ${id}: ${error}`);
    }
}

function DeselectAllValuesInListbox(id) {
    DebugLog(`Deselecting all values in listbox ${id}`);

    var selectOptions = document.getElementById(id).options;
    for (var i = 0; i < selectOptions.length; i++) {
        selectOptions[i].selected = false;
    }
}

function DebugLog(text, printStackTrace = false) {
    if (!debugging) { return; }

    console.log(text);

    if (!printStackTrace) { return; }
    // Print current stack trace
    console.trace();
}