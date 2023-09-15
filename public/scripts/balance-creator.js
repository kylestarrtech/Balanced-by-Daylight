Perks = null;
Killers = null;
Survivors = null;
Maps = null;

Tiers = [];
KillerBalance = [];


function main() {
    GetPerks();

    SetSearchEvents();
    SetTierEvents();
    Tiers.push(CreateTier("General"));
    LoadTier(0);

    SetKillerBalancing();
    SetTierButtonEvents();
    SetKillerOverrideEvents();

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

    console.log("Click");
    // Add On Click Events
    SrvIndvPrkBanButton.addEventListener("click", function() {
        // Get the selected perks
        var selectedPerks = GetSelectValues(document.getElementById("perk-search-results"));

        console.log(selectedPerks);

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
        console.log(`Passed Tier Index Guard Clause ${tierIndex}`);

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
        console.log(ComboObj)
        Tiers[tierIndex].SurvivorComboPerkBans.push(ComboObj);
        console.log(Tiers[tierIndex]);

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
        console.log(ComboObj)
        Tiers[tierIndex].KillerComboPerkBans.push(ComboObj);
        console.log(Tiers[tierIndex]);
        
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
    // Get the Killer Confirm Tier Button
    var killerConfirmTierButton = document.getElementById("killer-tier-confirmation-button");

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
        console.log(ComboObj)
        KillerBalance[killerIndex].KillerComboPerkBans.push(ComboObj);
        console.log(KillerBalance[killerIndex]);

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
        console.log(ComboObj)
        KillerBalance[killerIndex].SurvivorComboPerkBans.push(ComboObj);
        console.log(KillerBalance[killerIndex]);

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
        console.log(ComboObj)
        KillerBalance[killerIndex].KillerWhitelistedComboPerks.push(ComboObj);
        console.log(KillerBalance[killerIndex]);

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
        console.log(ComboObj)
        KillerBalance[killerIndex].SurvivorWhitelistedComboPerks.push(ComboObj);
        console.log(KillerBalance[killerIndex]);

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

function LoadKillerOverrideUI(id) {
    KillerData = KillerBalance[id];

    // Guard clause to make sure the killer data is valid.
    if (KillerData == undefined) {
        console.error("Killer balance data or Killer does not exist!");
        return;
    }

    // Once we know killer data is legit, we can apply it to frontend.

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
        NewKillerBalance = {
            Name: Killers[i],
            Map: [0], // Can be empty, which means all maps are allowed.
            BalanceTiers: [0], //Set to 0 for General Tier, which is always created.
            KillerIndvPerkBans: [],
            KillerComboPerkBans: [],
            SurvivorIndvPerkBans: [],
            SurvivorComboPerkBans: [],
            SurvivorWhitelistedPerks: [], // e.g. Skull Merchant sucks ass so we need to give people Potential Energy so games aren't slogs...
            SurvivorWhitelistedComboPerks: [], // In the case some perk combo deserves to be whitelisted for a particular Killer.
            KillerWhitelistedPerks: [], // If some Killer benefits particularly off of a perk.
            KillerWhitelistedComboPerks: [] // If some Killer benefits particularly off of a perk combo.
        }
        KillerBalance.push(NewKillerBalance);
    }
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

    tierDropdown.innerHTML = "";
    killerTierDropdown.innerHTML = "";

    for (var i = 0; i < Tiers.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = Tiers[i].Name;
        optionsElement.innerHTML = Tiers[i].Name;
        tierDropdown.appendChild(optionsElement);

        var optionsElement = document.createElement("option");
        optionsElement.value = Tiers[i].Name;
        optionsElement.innerHTML = Tiers[i].Name;
        killerTierDropdown.appendChild(optionsElement);
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
        }
    }
    xhttp.open("GET", "Maps.json", false);
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

    var FinalBalanceObj = {
        Name: document.getElementById("balance-name-textbox").value,
        Tiers: Tiers,
        KillerOverride: KillerBalance
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

function ImportBalancing() {
    var balanceImportBox = document.getElementById("balance-import-textbox");
    var balanceImportObj = JSON.parse(balanceImportBox.value);

    document.getElementById("balance-name-textbox").value = balanceImportObj.Name;
    Tiers = balanceImportObj.Tiers;
    KillerBalance = balanceImportObj.KillerOverride;

    UpdateDropdowns();
    LoadTier(0);
}