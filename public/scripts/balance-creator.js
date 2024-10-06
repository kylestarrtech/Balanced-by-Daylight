debugging = true;

Perks = null;
Killers = null;
Survivors = null;
Maps = null;
Addons = null;
Offerings = null;
Items = null;

MaximumPerkRepetition = 1;
GlobalNotes = "";
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

// Used to store what item IDs are shown in the dropdowns
ItemIDRange = [];

function main() {
    GetPerks();

    SetInitialEvents();

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

function SetInitialEvents() {
    let globalNotesArea = document.getElementById("global-notes-textarea");

    globalNotesArea.addEventListener("input", function() {
        GlobalNotes = globalNotesArea.value;
    });
}

function SetImportExportButtonEvents() {
    // Import Button
    var importButton = document.getElementById("balance-import-button");

    // Export Button
    var exportButton = document.getElementById("balance-export-button");
    var exportTextboxButton = document.getElementById("balance-textbox-export");
    var exportTextbox = document.getElementById("balance-export-textbox");

    exportButton.addEventListener("click", function() {
        ExportBalancing();
    });

    exportTextboxButton.addEventListener("click", function() {
        ExportBalancing(downloadFile=false);
        exportTextbox.style.display = "";
    });

    exportTextbox.addEventListener("focusout", function() {
        exportTextbox.style.display = "none";
    })

    importButton.addEventListener("click", function() {
        console.log("Getting file contents");
        GetFileContents(function() {
            console.log("Completed!");
            ImportBalancing(); // Import balancing upon completion.
        });
        console.log("Done!");
    });
}

function SetMiscDropdownEvents() {
    // Update perk repetition event
    var perkRepetitionDropdown = document.getElementById("maximum-perk-repetition-dropdown");
    perkRepetitionDropdown.addEventListener("change", function() {
        SetMaximumPerkRepetition(perkRepetitionDropdown.value);
        SyncMaxRepetitionDropdownValue();
    }); 

    // Update map search event
    var mapSearchTextbox = document.getElementById("map-search-textbox");
    mapSearchTextbox.addEventListener("input", function() {
        UpdateMapDropdowns();
    });
}

/// Sometimes the maximum perk repetition dropdown will desync from the value of its variable. This function will sync the dropdown value to the variable value.
function SyncMaxRepetitionDropdownValue() {
    var perkRepetitionDropdown = document.getElementById("maximum-perk-repetition-dropdown");
    perkRepetitionDropdown.value = MaximumPerkRepetition;
    DebugLog(`Maximum Perk Repetition set to <b>${MaximumPerkRepetition}</b>`);
}

/// Sets the maximum perk repetition variable with the appropriate restrictions.
function SetMaximumPerkRepetition(newVal) {
    MaximumPerkRepetition = parseInt(newVal);

    if (MaximumPerkRepetition == undefined) {
        console.error(`Maximum perk repetition is undefined! Defaulting to 1`);
        MaximumPerkRepetition = 1;
    }

    if (isNaN(MaximumPerkRepetition)) {
        console.error(`Maximum perk repetition is not a number! Defaulting to 1`);
        MaximumPerkRepetition = 1;
    } else {
        if (MaximumPerkRepetition < 1) {
            console.error(`Maximum perk repetition is less than 1! Defaulting to 1`);
            MaximumPerkRepetition = 1;
        }

        if (MaximumPerkRepetition > 4) {
            console.error(`Maximum perk repetition is greater than 4! Defaulting to 4`);
            MaximumPerkRepetition = 4;
        }
    }
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

        KillerBalance[selectedKillerIndex]["AntiFacecampPermitted"] = antiFacecampCheckbox.checked;
        DebugLog(`Anti-Facecamp set to <b>${KillerBalance[selectedKillerIndex].AntiFacecamp}</b> for <b>${KillerBalance[selectedKillerIndex].Name}</b>`);
    });
    
    var disabledCheckbox = document.getElementById("killer-disabled-checkbox");
    disabledCheckbox.addEventListener("change", function() {
        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        KillerBalance[selectedKillerIndex].IsDisabled = disabledCheckbox.checked;
        DebugLog(`Disabled set to <b>${KillerBalance[selectedKillerIndex].IsDisabled}</b> for <b>${KillerBalance[selectedKillerIndex].Name}</b>`);
    });
    
    var killerNotesTextArea = document.getElementById("killer-override-notes-textarea");
    killerNotesTextArea.addEventListener("input", function() {
        var selectedKillerIndex = GetCurrentKillerIndex(GetCurrentKiller());
        if (selectedKillerIndex == -1) { console.error("Invalid killer name!"); return; }

        KillerBalance[selectedKillerIndex].KillerNotes = killerNotesTextArea.value;
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
            let addonToAdd = parseInt(selectedAddons[i]);

            if (isNaN(addonToAdd)) { console.error("Invalid addon ID!"); continue; }
            
            if (KillerBalance[selectedKiller].IndividualAddonBans.includes(addonToAdd)) { continue; }

            KillerBalance[selectedKiller].IndividualAddonBans.push(addonToAdd);
        }

        DebugLog(`Added <b>${selectedAddons}</b> to <b>${KillerBalance[selectedKiller].Name}</b>`);
        LoadKillerOverrideUI(selectedKiller);
    });

    // Set the Remove Addon(s) Button Event
    var addonRemoveButton = document.getElementById("killer-individual-addon-ban-remove-bans-button");
    addonRemoveButton.addEventListener("click", function() {
        // Get the addons selected
        var selectedAddons = GetSelectValues(document.getElementById("killer-individual-addon-confirmed-bans-dropdown"));
        
        console.log("REMOVING THE FOLLOWING ADDONS:");
        console.log(selectedAddons);

        // Get the selected killer
        var selectedKiller = GetCurrentKillerIndex();
        if (selectedKiller == -1) { console.error("Invalid killer name!"); return;}

        // Remove the addon selections from the killer if they are in the list
        for (var i = 0; i < selectedAddons.length; i++) {
            // Converty selected addon to a number
            let addonToRemove = parseInt(selectedAddons[i]);

            if (!KillerBalance[selectedKiller].IndividualAddonBans.includes(addonToRemove)) { continue; }
            console.log(`Removing ${addonToRemove}`);
            KillerBalance[selectedKiller].IndividualAddonBans.splice(KillerBalance[selectedKiller].IndividualAddonBans.indexOf(addonToRemove), 1);
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
        
        console.log(selectedMaps);

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;

        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i].Name === selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the indexes of the maps with the same name
        var mapIndexes = [];
        for (var i = 0; i < selectedMaps.length; i++) {
            for (var j = 0; j < Maps.length; j++) {
                if (Maps[j]["ID"] == selectedMaps[i]) {
                    mapIndexes.push(selectedMaps[i]);
                    continue;
                }
            }
        }

        // Set the mapIndexes to the killer
        KillerBalance[killerIndex].Map = mapIndexes;

        let consoleMapString = "";
        for (var i = 0; i < mapIndexes.length; i++) {
            consoleMapString += `${FindMapByID(mapIndexes[i])["Name"]}`;
            if (i != mapIndexes.length - 1) {
                consoleMapString += ", ";
            }
        }

        DebugLog(`Map set to ${consoleMapString} for \"${KillerBalance[killerIndex].Name}\"`);
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
                DebugLog(`Comparing ${Offerings.Killer[j]["name"]} to ${selectedOfferings[i]}`);
                if (Offerings.Killer[j]["name"] == selectedOfferings[i]) {
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
                if (Offerings.Survivor[j]["name"] == selectedOfferings[i]) {
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

    // Get the Killer Confirm Item(s) Button
    var killerConfirmItemButton = document.getElementById("killer-item-confirmation-button");

    killerConfirmItemButton.addEventListener("click", function() {
        // Get the items selected
        var itemDropdown = document.getElementById("killer-item-selection-dropdown");
        var selectedItems = GetSelectValues(itemDropdown);

        // Get the selected killer
        var selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i].Name === selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the killer's balance
        var killerBalance = KillerBalance[killerIndex];

        // Remove all items in the ID range from the whitelist
        for (var i = 0; i < ItemIDRange.length; i++) {
            // Remove the item from the whitelist assuming it exists
            if (killerBalance.ItemWhitelist.includes(ItemIDRange[i])) {
                killerBalance.ItemWhitelist.splice(killerBalance.ItemWhitelist.indexOf(ItemIDRange[i]), 1);
            }   
        }

        // Set the killer's ItemWhitelist value to the selected items
        for (var i = 0; i < selectedItems.length; i++) {
            // Convert the selected item to a number
            var itemNum = parseInt(selectedItems[i]);

            // Add the item to the whitelist
            killerBalance.ItemWhitelist.push(itemNum);
        }
    });

    // Get the Killer Confirm Addon(s) Button
    var killerConfirmAddonButton = document.getElementById("killer-item-addon-confirmation-button");

    killerConfirmAddonButton.addEventListener("click", function() {
        // Get the addons selected
        const addonDropdown = document.getElementById("killer-item-addon-selection-dropdown");
        var selectedAddons = GetSelectValues(addonDropdown);

        DebugLog(selectedAddons);

        // Get the selected killer
        let selectedKiller = document.getElementById("killer-selection-dropdown").value;
        
        // Get the index of the killer with the same name
        var killerIndex = -1;
        for (var i = 0; i < Killers.length; i++) {
            if (Killers[i].Name === selectedKiller) {
                killerIndex = i;
                continue;
            }
        }
        if (killerIndex == -1) { console.error("Invalid killer name!"); return;}

        // Get the killer's balance
        let killerBalance = KillerBalance[killerIndex];

        // Get the selected item type
        const selectedItemType = document.getElementById("killer-item-type-selection-dropdown").value;
        let addonWhitelist = killerBalance["AddonWhitelist"][selectedItemType]["Addons"];
        DebugLog(selectedItemType);
        DebugLog(addonWhitelist);

        if (addonWhitelist == undefined) {
            console.error("Invalid item type!");
            return;
        }

        // Set the killer's AddonWhitelist value to the selected addons
        KillerBalance[killerIndex]["AddonWhitelist"][selectedItemType]["Addons"] = [];

        for (var i = 0; i < selectedAddons.length; i++) {
            // Convert the selected addon to a number
            var addonNum = parseInt(selectedAddons[i]);

            // Add the addon to the whitelist
            KillerBalance[killerIndex]["AddonWhitelist"][selectedItemType]["Addons"].push(addonNum);
        }
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
            if (Killers[i].Name === selectedKiller) {
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
        if (Killers[i].Name === name) {
            killerIndex = Killers[i].ID;
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
        alert(`Killer \"${Killers[id]}\" does not exist in this balancing tree. This can happen if the balance export data was directly modified. Exporting the balance data again may fix this issue.`);
        console.error("Killer balance data or Killer does not exist!");
        return;
    }
    
    // Once we know killer data is legit, we can apply it to frontend.
    
    DebugLog(`Loading balance data for Killer <b>${KillerBalance[id].Name}</b>`);
    
    // Load Anti-Facecamp Checkbox
    var antiFacecampCheckbox = document.getElementById("killer-antifacecamp-checkbox");
    antiFacecampCheckbox.checked = KillerData.AntiFacecampPermitted;

    var disabledCheckbox = document.getElementById("killer-disabled-checkbox");
    disabledCheckbox.checked = KillerData.IsDisabled;

    // Load Killer Notes
    var killerNotesTextArea = document.getElementById("killer-override-notes-textarea");
    killerNotesTextArea.value = KillerData.KillerNotes;

    // Reset map search textbox
    var mapSearchTextbox = document.getElementById("map-search-textbox");
    mapSearchTextbox.value = "";
    // Load Map Search Results
    UpdateMapDropdowns();

    // Load Selected Tiers
    DeselectAllValuesInListbox("killer-tier-selection-dropdown");
    DeselectAllValuesInListbox("survivor-balance-tier-dropdown");

    SelectValuesInListbox("killer-tier-selection-dropdown", KillerData.BalanceTiers);
    SelectValuesInListbox("survivor-balance-tier-dropdown", KillerData.SurvivorBalanceTiers);

    // Load Map Selection
    DeselectAllValuesInListbox("map-selection-dropdown");
    
    SelectOptionsFromMaps("map-selection-dropdown", KillerData.Map);

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
        let currentAddon = Addons[CurrentKiller].Addons[i];
        let currentRarity = currentAddon["Rarity"];
        
        // Skip if the rarity is banned
        var currentCheckbox = document.getElementById(AddonCheckboxBanIDList[currentRarity]);

        if (currentCheckbox.checked) { continue; }

        //DebugLog(CurrentAddonList);
        var optionsElement = document.createElement("option");
        optionsElement.value = currentAddon["globalID"];
        optionsElement.innerHTML = currentAddon["Name"];
        optionsElement.style.backgroundColor = TIER_RARITY_COLOURLIST[currentRarity];
        optionsElement.style.color = "white";
        optionsElement.style.fontWeight = 700;
        optionsElement.style.textShadow = "0px 0px 5px black";
        optionsElement.style.textAlign = "center";
        optionsElement.style.border = "1px solid black";
        optionsElement.style.padding = "5px";
        //DebugLog(`Added Addon ${CurrentAddonList[j]} to ${KillerBalance[CurrentKiller].Name}`);
        addonDropdown.appendChild(optionsElement);
    }

    // The confirmed addon bans dropdown
    addonDropdown = document.getElementById("killer-individual-addon-confirmed-bans-dropdown");
    addonDropdown.innerHTML = "";

    console.log(`LoadKillerOverrideUI(${id}): ${KillerData.IndividualAddonBans}`)

    for (var i = 0; i < KillerData.IndividualAddonBans.length; i++) {
        let currentAddonID = KillerData.IndividualAddonBans[i];
        let currentAddon = GetAddonById(currentAddonID);

        if (currentAddon == undefined) { continue; }

        var optionsElement = document.createElement("option");
        optionsElement.value = currentAddon["globalID"];
        optionsElement.innerHTML = currentAddon["Name"];
        
        // Get the rarity of the addon
        addonRarity = currentAddon["Rarity"];

        optionsElement.style.backgroundColor = TIER_RARITY_COLOURLIST[addonRarity];

        optionsElement.style.color = "white";
        optionsElement.style.fontWeight = 700;
        optionsElement.style.textShadow = "0px 0px 5px black";
        optionsElement.style.textAlign = "center";
        optionsElement.style.border = "1px solid black";
        optionsElement.style.padding = "5px";
        addonDropdown.appendChild(optionsElement);
    }

    LoadPermittedItemsDropdowns();

    // Load Killer Offerings Allowed
    var offeringDropdown = document.getElementById("killer-offering-selection-dropdown");
    var offeringsAllowed = KillerData.KillerOfferings;

    SelectValuesInListbox("killer-offering-selection-dropdown", offeringsAllowed);

    // Load Survivor Offerings Allowed
    offeringDropdown = document.getElementById("survivor-offering-selection-dropdown");
    offeringsAllowed = KillerData.SurvivorOfferings;

    SelectValuesInListbox("survivor-offering-selection-dropdown", offeringsAllowed);

    // Create alphabetically sorted list
    // This will be used as a dummy list to sort the perks without affecting the original list
    var sortedPerks = [];

    // Apply it to KillerIndvBanDropdown
    var KlrIndvPrkBanDropdown = document.getElementById("killer-tiered-individual-perk-ban-dropdown");
    KlrIndvPrkBanDropdown.innerHTML = "";

    sortedPerks = KillerData.KillerIndvPerkBans.sort(function(a, b) {
        var nameA = Perks[a].name.toUpperCase();
        var nameB = Perks[b].name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

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

    sortedPerks = KillerData.KillerWhitelistedPerks.sort(function(a, b) {
        var nameA = Perks[a].name.toUpperCase();
        var nameB = Perks[b].name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

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

    sortedPerks = KillerData.SurvivorIndvPerkBans.sort(function(a, b) {
        var nameA = Perks[a].name.toUpperCase();
        var nameB = Perks[b].name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

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

    sortedPerks = KillerData.SurvivorWhitelistedPerks.sort(function(a, b) {
        var nameA = Perks[a].name.toUpperCase();
        var nameB = Perks[b].name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

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

function LoadPermittedItemsDropdowns() {
    let itemTypesDropdown = document.getElementById("killer-item-type-selection-dropdown")

    itemTypesDropdown.innerHTML = "";

    for (const itemType of Items["ItemTypes"]) {
        let optionsElement = document.createElement("option");
        optionsElement.value = itemType["Name"];
        optionsElement.innerHTML = itemType["Name"];
        itemTypesDropdown.appendChild(optionsElement);
    }

    itemTypesDropdown.addEventListener("change", function() {
        // Get the selected item type
        let selectedItemType = itemTypesDropdown.value;

        // Reset the item range
        ItemIDRange = [];

        // Get the items of the selected type
        let itemsOfType = FindItemsOfType(selectedItemType);

        // Get the item dropdown
        let itemDropdown = document.getElementById("killer-item-selection-dropdown");
        itemDropdown.innerHTML = "";

        for (const item of itemsOfType) {
            let optionsElement = document.createElement("option");
            optionsElement.value = item["id"];
            ItemIDRange.push(item["id"]);
            optionsElement.innerHTML = item["Name"];
            optionsElement.style.backgroundImage = `url(${item["icon"]})`;
            optionsElement.style.backgroundSize = "contain";
            optionsElement.style.backgroundRepeat = "no-repeat";
            optionsElement.style.backgroundPosition = "right center";
            optionsElement.style.minHeight = "25px";
            itemDropdown.appendChild(optionsElement);
        }

        let KillerData = KillerBalance[GetCurrentKillerIndex()];
        DebugLog(KillerData.ItemWhitelist);
        SelectOptionsFromValues("killer-item-selection-dropdown", KillerData.ItemWhitelist);

        let itemAddonDropdown = document.getElementById("killer-item-addon-selection-dropdown");
        itemAddonDropdown.innerHTML = "";

        let addonsOfItem = FindAddonsOfType(selectedItemType);

        for (const addon of addonsOfItem) {
            let optionsElement = document.createElement("option");
            optionsElement.value = addon["id"];
            optionsElement.innerHTML = addon["Name"];
            optionsElement.style.backgroundImage = `url(${addon["icon"]})`;
            optionsElement.style.backgroundSize = "contain";
            optionsElement.style.backgroundRepeat = "no-repeat";
            optionsElement.style.backgroundPosition = "right center";
            optionsElement.style.minHeight = "25px";
            itemAddonDropdown.appendChild(optionsElement);
        }

        SelectOptionsFromValues("killer-item-addon-selection-dropdown", KillerData.AddonWhitelist[selectedItemType]["Addons"]);
    });

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
        NewKillerBalance = CreateKillerOverride(Killers[i].Name);
        KillerBalance.push(NewKillerBalance);
    }
}

/**
 * Creates a new killer override
 * @param {string} name The name of the Killer object
 * @returns {object} The killer balancing
 */
function CreateKillerOverride(name) {
    let AddonWhitelistSkeleton = {};

    for (const itemType of Items["ItemTypes"]) {
        AddonWhitelistSkeleton[itemType["Name"]] = {};
        
        AddonWhitelistSkeleton[itemType["Name"]]["Addons"] = [];
    }

    NewKillerBalance = {
        Name: name,
        KillerNotes: "", // Notes about the killer, e.g. specific rules/exceptions that can't be covered by the balancing system.
        IsDisabled: false, // Whether or not the killer is disabled for the purposes of the balancing.
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
        ItemWhitelist: [], // IDs of the items that are whitelisted.
        AddonWhitelist: AddonWhitelistSkeleton, // Indices of the addons that are whitelisted by item type.
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

    // Dummy list to sort the perks without affecting the original list
    sortedPerks = [];

    // Apply it to SurvIndvBanDropdown
    var SrvIndvPrkBanDropdown = document.getElementById("survivor-individual-perk-ban-dropdown");
    SrvIndvPrkBanDropdown.innerHTML = "";

    console.log("AAAAAAAAAWRFASIOWEFHNIOASN");
    console.log(TierData.SurvivorIndvPerkBans);

    sortedPerks = TierData.SurvivorIndvPerkBans.sort(function(a, b) {
        var nameA = Perks[a].name.toUpperCase();
        var nameB = Perks[b].name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

    console.log(sortedPerks);

    for (var i = 0; i < sortedPerks.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = sortedPerks[i];
        optionsElement.innerHTML = Perks[sortedPerks[i]].name;
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

    sortedPerks = TierData.KillerIndvPerkBans.sort(function(a, b) {
        var nameA = Perks[a].name.toUpperCase();
        var nameB = Perks[b].name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

    for (var i = 0; i < sortedPerks.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = sortedPerks[i];
        optionsElement.innerHTML = Perks[sortedPerks[i]].name;
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
    SyncMaxRepetitionDropdownValue();

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
        optionsElement.value = Killers[i].Name;
        optionsElement.innerHTML = Killers[i].Name;
        killerDropdown.appendChild(optionsElement);
    }


    var killerOfferingDropdown = document.getElementById("killer-offering-selection-dropdown");
    killerOfferingDropdown.innerHTML = "";

    for (var i = 0; i < Offerings.Killer.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Offerings.Killer[i]["name"];
        optionsElement.innerHTML = Offerings.Killer[i]["name"];
        killerOfferingDropdown.appendChild(optionsElement);
    }

    var survivorOfferingDropdown = document.getElementById("survivor-offering-selection-dropdown");
    survivorOfferingDropdown.innerHTML = "";

    for (var i = 0; i < Offerings.Survivor.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Offerings.Survivor[i]["name"];
        optionsElement.innerHTML = Offerings.Survivor[i]["name"];
        survivorOfferingDropdown.appendChild(optionsElement);
    }
}

function UpdateMapDropdowns() {
    var mapDropdown = document.getElementById("map-selection-dropdown");
    var mapSearchTextbox = document.getElementById("map-search-textbox");

    mapDropdown.innerHTML = "";

    for (var i = 0; i < Maps.length; i++) {
        mapName = Maps[i]["Name"];

        if (!IsNameInSearch(mapSearchTextbox.value, mapName)) {
            continue;
        }

        var optionsElement = document.createElement("option");
        optionsElement.value = Maps[i]["ID"];
        optionsElement.innerHTML = `${Maps[i]["Name"]}`;
        mapDropdown.appendChild(optionsElement);
    }
}

function IsNameInSearch(searchString, name) {
    if (searchString == "") { return true; }

    // Separate search string by commas.
    var searchTerms = searchString.split(",");

    for (var i = 0; i < searchTerms.length; i++) {
        if (name.toLowerCase().includes(searchTerms[i].toLowerCase())) {
            return true;
        }
    }

    return false;
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

    var perkSearchTextbox = document.getElementById("perk-search-textbox");
    perkSearchTextbox.addEventListener("keyup", function(event) {
        if (event.key == "Enter") {
            event.preventDefault();
            searchButton.click();
        }
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

    // Organize searchResults list alphabetically by the name property
    searchResults.sort(function(a, b) {
        var nameA = a.name.toUpperCase();
        var nameB = b.name.toUpperCase();

        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0;
    });

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
    xhttp.open("GET", "NewMaps.json", false);
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
            GetItems();
        }
    }
    xhttp.open("GET", "NewAddons.json", false);
    xhttp.send();
}

function GetItems() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Items = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting items: " + this.status);
            }
            GetOfferings();
        }
    }
    xhttp.open("GET", "Items.json", false);
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
        let perkName = Perks[i].name;

        if (!IsNameInSearch(searchQuery, perkName)) {
            continue;
        }

        if (Perks[i].survivorPerk == isSurvivor) {
                searchResults.push(Perks[i]);
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
function ExportBalancing(downloadFile = true) {

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

    let maxPerkRepetition = document.getElementById("maximum-perk-repetition-dropdown").value;
    // Convert maxPerkRepetition to an integer
    maxPerkRepetition = parseInt(maxPerkRepetition);

    RemoveAllDuplicates(); // Remove all duplicates from the balancing.

    NewTierExport = [];
    for (var i = 0; i < Tiers.length; i++) {
        NewTier = CreateTier(Tiers[i].Name);

        NewTier.SurvivorIndvPerkBans = Tiers[i].SurvivorIndvPerkBans;
        NewTier.SurvivorComboPerkBans = Tiers[i].SurvivorComboPerkBans;
        NewTier.KillerIndvPerkBans = Tiers[i].KillerIndvPerkBans;
        NewTier.KillerComboPerkBans = Tiers[i].KillerComboPerkBans;

        NewTierExport.push(NewTier);
    }

    // Check if any killer is missing from the KillerBalance array
    for (var i = 0; i < Killers.length; i++) {
        var killerExists = false;
        for (var j = 0; j < KillerBalance.length; j++) {
            if (KillerBalance[j].Name === Killers[i].Name) {
                killerExists = true;
                break;
            }
        }

        if (killerExists) { continue; }
        
        console.error(`Killer ${Killers[i].Name} is missing from the KillerBalance array! Adding it now...`);
        
        // Add the killer at the specified index "i"
        KillerBalance.splice(i, 0, CreateKillerOverride(Killers[i].Name));

    }

    NewKillerExport = [];
    for (var i = 0; i < KillerBalance.length; i++) {
        NewKiller = CreateKillerOverride(KillerBalance[i].Name);
        DebugLog(KillerBalance[i]);

        NewKiller.IsDisabled = KillerBalance[i].IsDisabled == undefined ? false : KillerBalance[i].IsDisabled;
        
        NewKiller.KillerNotes = KillerBalance[i].KillerNotes == undefined ? "" : KillerBalance[i].KillerNotes;

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
        NewKiller.ItemWhitelist = KillerBalance[i].ItemWhitelist;
        NewKiller.AddonWhitelist = KillerBalance[i].AddonWhitelist;


        NewKillerExport.push(NewKiller);
    }

    var FinalBalanceObj = {
        Name: document.getElementById("balance-name-textbox").value,
        Version: GetCurrentEpochTime(),
        MaxPerkRepetition: maxPerkRepetition,
        GlobalNotes: GlobalNotes,
        Tiers: NewTierExport,
        KillerOverride: NewKillerExport
    }

    var finalValue = JSON.stringify(FinalBalanceObj, null, '\t');

    var balanceExportBox = document.getElementById("balance-export-textbox");
    balanceExportBox.value = finalValue;

    if (downloadFile) {
        DownloadData(FinalBalanceObj);
    }
}


function DownloadData(obj) {
    let balanceExportButton = document.getElementById("balance-export-button");

    balanceExportButton.style.display = "hidden";

    try {
        const stringified = JSON.stringify(obj, null, '\t');
    
        const blob = new Blob([stringified], {type: "application/json"});
    
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
    
        let fileName = document.getElementById("balance-name-textbox").value;
        if (fileName == "") { fileName = "preset.json"; }
    
        // Sanitize the title such that it can be used as a file name.
        fileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
        link.download = `${fileName}.json`;
    
        link.click();
    
        URL.revokeObjectURL(link.href);
    } catch (err) {
        alert("There was an error exporting this balancing. Please hit Ctrl+Shift+J (open the Inspect Element console), copy the full error (or take a screenshot) and report it as an issue!");
        console.error(err);
    }

    balanceExportButton.style.display = "";
}

function GetCurrentEpochTime() {
    return Math.floor(Date.now() / 1000);
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
 * 
 * @param {function} completed 
 */
function GetFileContents(completed) {
    const targetTextbox = document.getElementById("balance-import-textbox");

    const fileInput = document.getElementById("import-balancing-file");
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const jsonString = e.target.result;
                
                // Set textbox import field
                targetTextbox.value = jsonString;
                console.log("Value set!");
            } catch (err) {
                console.error("Error reading file:", err);
                alert(`There was an error reading the file contents! Defaulting to textbox. Error is below:\n\n${err}`)
            }
            completed();
        };

        reader.readAsText(file);
    } else {
        console.log("No file selected!");
        completed();
    }
}

/**
 * Import a balancing from a JSON string.
 * 
 * Goes property by property to ensure that if something is added to the balancing, it won't break the import.
 */
function ImportBalancing() {
    var balanceImportBox = document.getElementById("balance-import-textbox");
    var balanceImportObj = undefined;

    try {
        balanceImportObj = JSON.parse(balanceImportBox.value);
    } catch (err) {
        console.error(`Invalid JSON: ${err}`)
        alert(`Invalid import parameters (Invalid JSON). Error is below:\n\n${err}`);
        return;
    }

    document.getElementById("balance-name-textbox").value = balanceImportObj.Name;

    console.log("KILLER BALANCE:");
    console.log(KillerBalance);
    console.log("BALANCE IMPORT OBJ:");
    console.log(balanceImportObj.KillerOverride);

    SetMaximumPerkRepetition(balanceImportObj.MaxPerkRepetition);

    console.log(`Setting max perk repetition: ${MaximumPerkRepetition}`);
    SyncMaxRepetitionDropdownValue();

    GlobalNotes = 
        balanceImportObj.GlobalNotes == undefined ?
        "" :
        balanceImportObj.GlobalNotes;

    globalNotesArea = document.getElementById("global-notes-textarea");
    globalNotesArea.value = GlobalNotes;

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

    // Check to see if any Killers exist in KillerBalance that don't exist in the imported balance
    for (var i = 0; i < KillerBalance.length; i++) {
        let killerExists = false;

        for (var j = 0; j < balanceImportObj.KillerOverride.length; j++) {
            if (KillerBalance[i].Name == balanceImportObj.KillerOverride[j].Name) {
                killerExists = true;
                break;
            }
        }
        
        if (killerExists) { continue; }

        // Add the killer to the balance if it doesn't exist
        console.log(`Killer ${KillerBalance[i].Name} does not exist in the imported balance! Adding...`);
        balanceImportObj.KillerOverride.push(CreateKillerOverride(KillerBalance[i].Name));

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

        if (curKiller.IsDisabled != undefined) {
            NewKillerBalance.IsDisabled = curKiller.IsDisabled;
        } else {
            NewKillerBalance.IsDisabled = false;
        }

        if (curKiller.KillerNotes != undefined) {
            NewKillerBalance.KillerNotes = curKiller.KillerNotes;
        } else {
            NewKillerBalance.KillerNotes = "";
        }

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

        // Check if Individual bans are parsable as integers
        let rawIndvAddonBans = curKiller.IndividualAddonBans;
        let sanitizedIndvAddonBanList = [];
        for (let j = 0; j < rawIndvAddonBans.length; j++) {
            testParse = parseInt(rawIndvAddonBans[j]);

            if (isNaN(testParse)) {
                // Using old format, so we need to convert it to the new format
                console.log(`Converting old format ban ${rawIndvAddonBans[j]} to new format...`);

                // Find addon by name
                let addon = GetAddonByName(rawIndvAddonBans[j]);

                console.log(`Addon found:`);
                console.log(addon);

                if (addon == undefined) {
                    console.error(`Addon ${rawIndvAddonBans[j]} is not a valid addon!`);
                    continue;
                }

                sanitizedIndvAddonBanList.push(addon["globalID"]);
            } else {
                // Using new format, so we can just add it to the list
                sanitizedIndvAddonBanList.push(testParse);
            }
        }
        NewKillerBalance.IndividualAddonBans = sanitizedIndvAddonBanList;
        console.log(`Sanitized individual addon bans:`);
        console.log(sanitizedIndvAddonBanList);


        NewKillerBalance.SurvivorOfferings = curKiller.SurvivorOfferings;
        NewKillerBalance.KillerOfferings = curKiller.KillerOfferings;

        NewKillerBalance.ItemWhitelist = SanitizeKillerBalanceProperty(NewKillerBalance.ItemWhitelist, curKiller.ItemWhitelist);
        NewKillerBalance.AddonWhitelist = SanitizeKillerBalanceProperty(NewKillerBalance.AddonWhitelist, curKiller.AddonWhitelist);

        KillerBalance.push(NewKillerBalance);
    }

    UpdateDropdowns();
    LoadTier(0);
    LoadKillerOverrideUI(0);

    RemoveAllDuplicates();
}

function RemoveAllDuplicates() {
    
    // Remove duplicates from all Tiers
    for (let i = 0; i < Tiers.length; i++) {
        RemoveDuplicatesFromTier(i);
    }

    for (let i = 0; i < KillerBalance.length; i++) {
        RemoveDuplicatesFromKiller(i);
    }

    UpdateDropdowns();
    LoadTier(GetCurrentTierIndex());
    LoadKillerOverrideUI(GetCurrentKillerIndex());
}

function RemoveDuplicatesFromTier(index) {
    let target = Tiers[index];

    let newHolderList = undefined;

    // -=-=-=-=-=-=-=-=[ SURV ]=-=-=-=-=-=-=-=-

    newHolderList = RemoveDuplicatesFromList(target["SurvivorIndvPerkBans"]);
    target["SurvivorIndvPerkBans"] = newHolderList;

    newHolderList = RemoveDuplicatesFromListInList(target["SurvivorComboPerkBans"])
    target["SurvivorComboPerkBans"] = newHolderList;

    // -=-=-=-=-=-=-=-=[KILLER]=-=-=-=-=-=-=-=-

    newHolderList = RemoveDuplicatesFromList(target["KillerIndvPerkBans"]);
    target["KillerIndvPerkBans"] = newHolderList;

    newHolderList = RemoveDuplicatesFromListInList(target["KillerComboPerkBans"]);
    target["KillerComboPerkBans"] = newHolderList;


    Tiers[index] = target;
}

function RemoveDuplicatesFromKiller(index) {
    let target = KillerBalance[index];

    let newHolderList = undefined;

    // -=-=-=-=-=-=-=-=[ SURV ]=-=-=-=-=-=-=-=-

    newHolderList = RemoveDuplicatesFromList(target["SurvivorIndvPerkBans"]);
    target["SurvivorIndvPerkBans"] = newHolderList;

    newHolderList = RemoveDuplicatesFromListInList(target["SurvivorComboPerkBans"])
    target["SurvivorComboPerkBans"] = newHolderList;

    newHolderList = RemoveDuplicatesFromList(target["SurvivorWhitelistedPerks"]);
    target["SurvivorWhitelistedPerks"] = newHolderList;

    newHolderList = RemoveDuplicatesFromListInList(target["SurvivorWhitelistedComboPerks"])
    target["SurvivorWhitelistedComboPerks"] = newHolderList;

    // -=-=-=-=-=-=-=-=[KILLER]=-=-=-=-=-=-=-=-

    newHolderList = RemoveDuplicatesFromList(target["KillerIndvPerkBans"]);
    target["KillerIndvPerkBans"] = newHolderList;

    newHolderList = RemoveDuplicatesFromListInList(target["KillerComboPerkBans"]);
    target["KillerComboPerkBans"] = newHolderList;

    newHolderList = RemoveDuplicatesFromList(target["KillerWhitelistedPerks"]);
    target["KillerWhitelistedPerks"] = newHolderList;

    newHolderList = RemoveDuplicatesFromListInList(target["KillerWhitelistedComboPerks"])
    target["KillerWhitelistedComboPerks"] = newHolderList;


    KillerBalance[index] = target;
}

/* HELPER FUNCTIONS */

/**
 * Sanitizes a killer balance property for import. This way if a new property appears old balancing remains compatible.
 * @param {*} curProperty The current property.
 * @param {*} newProperty The desired new property.
 * @returns 
 */
function SanitizeKillerBalanceProperty(curProperty, newProperty) {
    if (newProperty == undefined) {
        return curProperty;
    }

    return newProperty;
}

/**
 * Removes duplicates from a list by iteratively adding the values to a Hashtable then returning the Hashtable (as they cannot have duplicates).
 * @param {Array} list 
 */
function RemoveDuplicatesFromList(list) {
    const map = new Map();
    return list.filter(item => !map.has(item) && map.set(item, true));
}

/**
 * To be used for lists that other lists. Adds all stringified values to a set, which cannot have duplicates. Order DOES matter (e.g. ["67", "76"] != ["76", "67"]).
 * @param {Array} list 
 */
function RemoveDuplicatesFromListInList(list) {
    const uniqueLists = new Set(list.map(JSON.stringify));
    return Array.from(uniqueLists, JSON.parse);
}

/**
 * Extrapolate's the Cantor Pairing Function to n>2 entries (4 Perks max) and iteratively reduces them until they reach a single value. The issue is this cannot be reversed.
 * @param {*} list 
 */
function GenerateUniquePairing(list) {
    if (list.length > 4 || list.length == 0) {
        console.error("List is not within 1-4 in length!");
        return;
    }

    //f(a,b) = (1/2)(a+b)(a+b+1)+b
    while (list.length > 1) {
        const valueA = list[0];
        const valueB = list[1];

        let outcome = (1/2) * (valueA + valueB) * (valueA + valueB + 1) + valueB; // Pairing function

        list = list.slice(1);
        list[0] = outcome; // Replace second element with the pairing function (now the first element)
        console.log(list);
    }
    
    console.log(`OUTPUT: ${list[0]}`);
    return list[0];
}

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
        if (Killers[i].Name == killerName) {
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

function GetCurrentTierIndex() {
    return document.getElementById("tier-selection-dropdown").selectedIndex;
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

/**
 * Selects the options in a listbox based on the input values instead of indices.
 * @param {*} id 
 * @param {*} values 
 */
function SelectOptionsFromValues(id, values) {
    DebugLog(`Selecting options ${values} in listbox ${id}`);

    try {
        const selectOptions = document.getElementById(id).options;
        for (const value of values) {
            for (const option of selectOptions) {
                if (option.value == value) {
                    option.selected = true;
                }
            }
        }
    } catch (error) {
        console.error(`Error selecting values in listbox ${id}: ${error}`);
    }
}

function SelectOptionsFromMaps(id, mapIDs) {
    DebugLog(`Selecting maps ${mapIDs} in listbox ${id}`);

    try {
        const selectOptions = document.getElementById(id).options;
        for (const mapID of mapIDs) {
            for (const option of selectOptions) {
                if (option.value == mapID) {
                    option.selected = true;
                }
            }
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

function FindItemsOfType(type) {
    var items = [];

    // Check if item type is valid
    if (type == undefined) {
        console.error(`Item type is undefined!`);
        return items;
    }

    let foundType = false;
    for (const itemType of Items["ItemTypes"]) {
        //DebugLog(`Checking item type ${itemType["Name"]} compared to ${type}`)
        //DebugLog(`Type of itemType: ${typeof itemType["Name"]} | Type of type: ${typeof type}`)
        if (itemType["Name"] == type) {
            foundType = true;
            break;
        }
    }
    if (!foundType) {
        console.error(`Item type ${type} is not a valid item type!`);
        return items;
    }

    // Find items of the specified type
    for (const item of Items["Items"]) {
        if (item["Type"] == type) {
            items.push(item);
        }
    }

    return items;
}

function FindItemWithID(id) {
    // Check if item id is valid
    if (id == undefined) {
        console.error(`Item id is undefined!`);
        return undefined;
    }

    // Find item with specified id
    for (const item of Items["Items"]) {
        if (item["id"] == id) {
            return item;
        }
    }

    return undefined;
}

function FindAddonsOfType(type) {
    var addons = [];

    // Check if item type is valid
    if (type == undefined) {
        console.error(`Item type is undefined!`);
        return addons;
    }

    let foundType = false;
    let typeIndex = 0;
    for (typeIndex = 0; typeIndex < Items["ItemTypes"].length; typeIndex++) {
        var itemType = Items["ItemTypes"][typeIndex];
        
        
        DebugLog(`Checking item type ${itemType["Name"]} compared to ${type}`)
        DebugLog(`Type of itemType: ${typeof itemType["Name"]} | Type of type: ${typeof type}`)
        
        if (itemType["Name"] == type) {
            foundType = true;
            break;
        }
    }
    if (!foundType) {
        console.error(`Item type ${type} is not a valid item type!`);
        return addons;
    }

    // Find addons of the specified type
    let currentItemType = Items["ItemTypes"][typeIndex];
    for (const addon of currentItemType["Addons"]) {
        addons.push(addon);
    }

    return addons;
}

function GetAddonById(id) {
    for (let i = 0; i < Addons.length; i++) {
        let currentKiller = Addons[i];

        for (let j = 0; j < currentKiller["Addons"].length; j++) {
            let currentAddon = currentKiller["Addons"][j];

            if (currentAddon["globalID"] == id) {
                return currentAddon;
            }
        }
    }

    return undefined;
}

function GetAddonByName(name) {
    for (let i = 0; i < Addons.length; i++) {
        let currentKiller = Addons[i];

        for (let j = 0; j < currentKiller["Addons"].length; j++) {
            let currentAddon = currentKiller["Addons"][j];

            if (currentAddon["Name"].toLowerCase() == name.toLowerCase()) {
                return currentAddon;
            }
        }
    }

    return undefined;
}

function FindMapByID(id) {
    for (let i = 0; i < Maps.length; i++) {
        if (Maps[i]["ID"] == id) {
            return Maps[i];
        }
    }

    return undefined;
}

function DebugLog(text, printStackTrace = false) {
    if (!debugging) { return; }

    console.log(text);

    if (!printStackTrace) { return; }
    // Print current stack trace
    console.trace();
}