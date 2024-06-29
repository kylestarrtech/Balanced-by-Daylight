/*
Name:
    checker-events.js
Purpose:
    This file is designed for the purpose of handling all of the event setup for the balance checker.
    Many of the methods in this file are designed to only be called once. This is to prevent multiple event listeners from being added to the same element.
    Please see the method mapper for more information.
*/

/**
 * Updates the settings balancing dropdown and also adds the change event to it.
 * 
 * TODO: See Github Issue #40 (https://github.com/kylestarrtech/DBD-Balance-Checker/issues/40)
 */
function UpdateBalancingDropdown() {
    var balancingDropdown = document.getElementById("balancing-select");

    balancingDropdown.innerHTML = "";

    for (var i = 0; i < BalancePresets.length; i++) {
        let currentPreset = BalancePresets[i];

        let optionElement = document.createElement("option");
        optionElement.innerText = currentPreset["Name"];
        optionElement.value = currentPreset["ID"];

        balancingDropdown.appendChild(optionElement);
    }
    balancingDropdown.value = currentBalancingIndex;

    balancingDropdown.addEventListener("change", function() {
        currentBalancingIndex = parseInt(balancingDropdown.value);
        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

        if (!ValidateCustomBalancing(GetBalancePresetByID(currentBalancingIndex)["Balancing"])) {
            GenerateAlertModal(
                "Error",
                "This default balance profile is invalid, selecting the default balance profile. Please report this to the GitHub issues page or the Discord server.",
                function() {
                    currentBalancingIndex = 0;
                    balancingDropdown.value = currentBalancingIndex;
                    localStorage.setItem("currentBalancingIndex", currentBalancingIndex);
                    
                    alert("Balance profile reset to default. Close this alert to continue.");
        
                    // Refresh the page
                    location.reload();
                }
            )
        }
        currentBalancing = GetBalancePresetByID(currentBalancingIndex)["Balancing"];

        UpdateBalanceSelectionUI();
    });

    // var customBalancingContainer = document.getElementById("custom-balance-select");
    // if (currentBalancingIndex == -1) {
    //     // Show custom balancing
    //     customBalancingContainer.hidden = false;
    // } else {
    //     // Hide custom balancing
    //     customBalancingContainer.hidden = true;
    // }

    var customBalanceCheckbox = document.getElementById("custom-balancing-checkbox");

    customBalanceCheckbox.addEventListener("change", function() {
        customBalanceOverride = customBalanceCheckbox.checked;
        localStorage.setItem("customBalanceOverride", customBalanceOverride);

        var customBalancingContainer = document.getElementById("custom-balance-select");
        var customBalanceLabel = document.getElementById("balance-mode-label");
        var customBalanceDropdown = document.getElementById("balancing-select");

        var balanceTypeBox = document.getElementById("balance-type-box");

        if (customBalanceOverride) {
            // Show custom balancing
            customBalancingContainer.hidden = false;
            customBalanceDropdown.hidden = true;
            customBalanceLabel.hidden = true;

            balanceTypeBox.style.display = "none";
        } else {
            // Hide custom balancing
            customBalancingContainer.hidden = true;
            customBalanceDropdown.hidden = false;
            customBalanceLabel.hidden = false;

            balanceTypeBox.style.display = "";
            SetBalanceTypeDisclaimer();

            customBalancingContainer.innerHTML = "";
        }
    });
}

/**
 * Responsible for setting the event for the role swap button. As a result, should only ever be called once.
 */
function LoadRoleSwapEvents() {
    let roleSwapButton = document.getElementById("role-swap-button");

    roleSwapButton.addEventListener("click", function() {
        DebugLog("Commencing role swap!");

        // Swap role
        selectedRole = selectedRole == 0 ? 1 : 0;

        localStorage.setItem("selectedRole", selectedRole);

        UpdateRoleSwapIcon();
        UpdateRoleSelectionHeaderUI();
        UpdatePerkUI();
        CheckForBalancingErrors();
    });
}

/**
 * Sets up the event to clear a build loadout and attaches it to the clear loadout button. Should only ever be called once.
 */
function LoadClearLoadoutButton() {
    let clearLoadoutButton = document.getElementById("clear-loadout-button");

    clearLoadoutButton.addEventListener("click", function() {
        if (selectedRole == 0) {
            ClearSurvivorPerks();
            ClearSurvivorOfferings();
            ClearSurvivorItems();
            ClearSurvivorAddons();

            if (Config.saveBuilds && saveLoadoutsAndKiller) {
                localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
                localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
                localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
                localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
            }
        } else {
            ClearKillerPerks();

            KillerOffering = undefined;
            
            ClearKillerAddons();

            if (Config.saveBuilds && saveLoadoutsAndKiller) {
                localStorage.setItem("KillerPerks", JSON.stringify(KillerPerks));
                localStorage.setItem("KillerOffering", "undefined");
                localStorage.setItem("KillerAddons", JSON.stringify(KillerAddons));
            }
        }

        UpdatePerkUI();
        CheckForBalancingErrors();
    });
}

/**
 * Responsible for setting the event listeners for the import and export buttons. As a result, should only ever be called once.
 */
function LoadImportEvents() {
    let importButton = document.getElementById("import-button");
    let exportButton = document.getElementById("export-button");

    importButton.addEventListener("click", function() {
        let importData = prompt("Please enter your build data here.\n\nThis data can be found by clicking the 'Export' button. Please note that improper formatting may result in unexpected behavior or loss of builds!");

        if (importData == null) {
            return;
        }

        try {
            const compressedDataDecoded = atob(importData);
            const inflate = pako.inflate(new Uint8Array([...compressedDataDecoded].map(char => char.charCodeAt(0))));
            const decompressedText = new TextDecoder().decode(inflate);
            
            let importDataObj = JSON.parse(decompressedText);

            DebugLog(importDataObj);

            // Is there a valid balancing index?
            if (importDataObj.currentBalancingIndex == undefined) {
                throw "Invalid import data. Current balancing index is undefined.";
            }

            // Is there a valid selected killer?
            if (importDataObj.selectedKiller == undefined) {
                throw "Invalid import data. Selected killer is undefined.";
            }

            // Is custom balancing enabled?
            if (importDataObj.customBalanceOverride == undefined) {
                throw "Invalid import data. Custom balancing is undefined.";
            }

            if (importDataObj.customBalanceOverride) {
                // Check if current balancing is valid
                let currentBalance = importDataObj.currentBalancing;
                if (!ValidateCustomBalancing(currentBalance)) {
                    throw "Invalid import data. Current balancing is invalid.";
                }
                currentBalancing = importDataObj.currentBalancing;
            }else{
                currentBalancing = GetBalancePresetByID(importDataObj.currentBalancingIndex)["Balancing"];
            }

            // Check if importData.survivorPerksId is a valid array
            if (importDataObj.survivorPerksId == undefined) {
                throw "Invalid import data. SurvivorPerks is undefined.";
            }
            if (importDataObj.survivorPerksId.length != 4) {
                throw "Invalid import data. SurvivorPerks length is not 4.";
            }

            // survCpt is the current survivor we're on
            let survCpt = 0

            // perkCpt is the current perk we're on
            let perkCpt = 0

            ClearSurvivorPerks();

            for(const currentSurvivor of importDataObj.survivorPerksId){
                if (currentSurvivor.length != 4) {
                    throw "Invalid import data. SurvivorPerks length is not 4.";
                }
                
                for(const currentPerkId of currentSurvivor){
                    if (currentPerkId == null) {
                        perkCpt++
                        continue;
                    }

                    SurvivorPerks[survCpt][perkCpt] = GetPerkById(currentPerkId)

                    perkCpt++
                }
                perkCpt = 0
                survCpt++
            }

            survCpt = 0
            for(const offeringId of importDataObj.survivorOfferingsId){
                SurvivorOfferings[survCpt] = GetOfferingById(offeringId)
                survCpt++
            }

            survCpt = 0
            for(const itemId of importDataObj.survivorItemsId){
                SurvivorItems[survCpt] = GetItemById(itemId)
                survCpt++
            }

            survCpt = 0
            /*
            AddonInfo = 
            [Addon1, Addon2] - Array(int)
            ItemType - String
            */
            for(const addonInfo of importDataObj.survivorAddonInfo){
                DebugLog(addonInfo);
                SurvivorAddons[survCpt] = [GetAddonById(addonInfo[1], addonInfo[0][0]), GetAddonById(addonInfo[1], addonInfo[0][1])];
                survCpt++;
            }

            let updateKillerPerks = importDataObj.killerPerksId != undefined;
            // Check if importData.killerPerksId is a valid array
            if (importDataObj.killerPerksId == undefined) {
                //throw "Invalid import data. KillerPerks is undefined.";
            }

            if (updateKillerPerks) {
                ClearKillerPerks();
    
                perkCpt = 0
                for(const currentPerkId of importDataObj.killerPerksId){
                    if (currentPerkId == null) {
                        perkCpt++
                        continue;
                    }
                    KillerPerks[perkCpt] = GetPerkById(currentPerkId);
    
                    perkCpt++
                }
    
            }
            
            KillerOffering = GetOfferingById(importDataObj.killerOfferingId);

            let updateKillerAddons = importDataObj.killerAddonsId != undefined;
            // Check if importData.killerAddonsId is a valid array
            if (importDataObj.killerAddonsId == undefined) {
                //throw "Invalid import data. KillerAddons is undefined.";
            }

            if (updateKillerAddons) {
                ClearKillerAddons();

                let addonCpt = 0
                for(const currentAddonId of importDataObj.killerAddonsId){
                    if (currentAddonId == null) {
                        addonCpt++
                        continue;
                    }
                    KillerAddons[addonCpt] = GetKillerAddonById(currentAddonId);

                    addonCpt++
                }
            }

            // If all checks pass, set the remaining data
            currentBalancingIndex = importDataObj.currentBalancingIndex;
            selectedKiller = importDataObj.selectedKiller;
            customBalanceOverride = importDataObj.customBalanceOverride;

            if (Config.saveBuilds && saveLoadoutsAndKiller) {
                localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
                localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
                localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
                localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
                
                localStorage.setItem("KillerPerks", JSON.stringify(KillerPerks));
                localStorage.setItem("KillerOffering", JSON.stringify(KillerOffering));
                localStorage.setItem("KillerAddons", JSON.stringify(KillerAddons));
                
                localStorage.setItem("selectedKiller", selectedKiller);
            }
            localStorage.setItem("currentBalancingIndex", currentBalancingIndex);
            localStorage.setItem("customBalanceOverride", customBalanceOverride);

            // Update UI
            UpdatePerkUI();
            UpdateBalancingDropdown();
            CheckForBalancingErrors();
            UpdateKillerSelectionUI();
            UpdateBalanceSelectionUI();
            ScrollToSelectedKiller();
        } catch (error) {
            GenerateAlertModal("Error", `An error occurred while importing your builds. Please ensure that the data is in the correct format.<br>Error: ${error}`);
            console.trace();
        }
    });

    exportButton.addEventListener("click", function() {
        let compressedText = GetExportData();

        // Ask user if they'd like to copy to clipboard. If yes, copy to clipboard. If no, return.
        // if (!confirm("Would you like to copy your build data to your clipboard?")) {
        //     return;
        // }

        // Copy exportData to clipboard
        var wasErr = false;
        try {
            navigator.clipboard.writeText(compressedText);
        } catch (error) {
            wasErr = true;
        }

        if (!wasErr) {
            GenerateAlertModal("Export and Copy Successful", "Your builds data has been copied to your clipboard!<br><br>Import Data:<br> <b><span class='import-code-preview'>" + compressedText + "</span></b>");
            return;
        }

        GenerateAlertModal("Export Successful", "Your builds data has been exported! <b>Copying to the clipboard was unsuccessful, please copy your import code manually.</b><br><br>Import Data:<br> <b><span class='import-code-preview'>" + compressedText + "</span></b>");
    });
}

/**
 * Responsible for setting the event listener for the Generate Image button. As a result, should only ever be called once.
 */
function LoadImageGenEvents() {
    const genImgButton = document.getElementById("generate-image-button");

    genImgButton.addEventListener("click", function() {
        GenerateImageFromButtonPress();
    });
}

/**
 * Sets the character select event for every killer portrait. As a result, should only ever be called once.
 */
function SetKillerCharacterSelectEvents() {
    var GetCharacterSelectButtons = document.getElementsByClassName("character-select-button");

    for (var i = 0; i < GetCharacterSelectButtons.length; i++) {
        let newIndex = i;
        let currentButton = GetCharacterSelectButtons[newIndex];

        let currentName = Killers[newIndex];
        currentButton.addEventListener("click", function() {
            let currentKlr = selectedKiller;
            DebugLog(newIndex);
            DebugLog(currentName);

            // If killer with currentName is not in the list, return
            let currentOverrides = currentBalancing.KillerOverride;
            let killerFound = false;
            for (var i = 0; i < currentOverrides.length; i++) {
                let currentOverride = currentOverrides[i];

                if (currentOverride.Name == currentName) {
                    killerFound = true;
                    break;
                }
            }

            if (!killerFound) {
                GenerateAlertModal("Killer Not Found", `Killer <b>${currentName}</b> not found in current balancing! Please select a different killer or change the balancing.`);
                return;
            }

            selectedKiller = newIndex;
            localStorage.setItem("selectedKiller", selectedKiller);

            let currentKillerOverride = currentBalancing.KillerOverride[selectedKiller];

            if (currentKlr != selectedKiller) {
                if (selectedRole != 0) {
                    ClearKillerAddons();
                }

                if (currentKillerOverride.IsDisabled != undefined) {
                    let isDisabled = currentKillerOverride.IsDisabled;

                    if (isDisabled) {
                        GenerateAlertModal("Killer Disabled", `Killer <b>${currentName}</b> is disabled in the current balancing! You may still select this killer, but they may be ineligible to play in official matches.`);
                    }
                }
            }

            if (!AreKillerAddonsValid()) {
                DebugLog("Reset killer addons as they are not valid for the selected killer.");
                KillerAddons = [undefined, undefined];
            }

            CheckIndividualKillerNotes(); // If autoshow notes setting is enabled, show notes for the selected killer.

            CheckForBalancingErrors();
            UpdateKillerSelectionUI();
            

            ScrollToSelectedKiller();
        });
    }
}

/**
 * Responsible for setting the events for the settings menu, including the checkboxes. As a result, should only ever be called once.
 */
function LoadSettingsEvents() {
    // Load settings button
    var settingsButton = document.getElementById("settings-button");
    settingsButton.addEventListener("click", function() {
        var settingsContainer = document.getElementById("settings-container");
        settingsContainer.hidden = !settingsContainer.hidden;
        
        var settingsBlur = document.getElementById("settings-blur");
        settingsBlur.classList.remove("background-blur");
        settingsBlur.classList.remove("background-outro-blur");
        settingsBlur.classList.add("background-blur");

        var settingsMenu = document.getElementById("settings-menu");
        settingsMenu.classList.remove("intro-blur-animation-class-1p0s");
        settingsMenu.classList.remove("outro-blur-animation-class-0p5s");
        settingsMenu.classList.add("intro-blur-animation-class-1p0s");
    });

    var settingsCancelButton = document.getElementById("settings-cancel-button");
    settingsCancelButton.addEventListener("click", function() {

        if (customBalanceOverride) {
            currentBalancing = GetCustomBalancing();

            // Save custom balancing to local storage
            localStorage.setItem("currentBalancing", JSON.stringify(currentBalancing));

            //currentBalancingIndex = -1;
        } else {
            currentBalancingIndex = parseInt(document.getElementById("balancing-select").value);
            currentBalancing = GetBalancePresetByID(currentBalancingIndex)["Balancing"];
        }
        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

        var settingsMenu = document.getElementById("settings-menu");
        settingsMenu.classList.remove("outro-blur-animation-class-0p5s");
        settingsMenu.classList.add("outro-blur-animation-class-0p5s");

        var settingsBlur = document.getElementById("settings-blur");
        settingsBlur.classList.remove("background-outro-blur");
        settingsBlur.classList.add("background-outro-blur");

        // Create a 1 second timer
        setTimeout(function() {
            var settingsContainer = document.getElementById("settings-container");
            settingsContainer.hidden = !settingsContainer.hidden;
        }, 500);

        UpdateBalanceSelectionUI();

        CheckForBalancingErrors();
    });

    const onlyNonBannedCheckbox = document.getElementById("only-non-banned");
    onlyNonBannedCheckbox.addEventListener("change", function(){
        onlyShowNonBanned = onlyNonBannedCheckbox.checked;
        localStorage.setItem("onlyShowNonBanned", onlyShowNonBanned);
    })

    const autoShowNotesCheckbox = document.getElementById("auto-show-notes");
    autoShowNotesCheckbox.addEventListener("change", function(){
        showNotesOnLaunch = autoShowNotesCheckbox.checked;
        localStorage.setItem("showNotesOnLaunch", showNotesOnLaunch);
    })

    const saveLoadoutsKillerCheckbox = document.getElementById("save-loadouts-killer");
    saveLoadoutsKillerCheckbox.addEventListener("change", function(){
        saveLoadoutsAndKiller = saveLoadoutsKillerCheckbox.checked;
        localStorage.setItem("saveLoadoutsAndKiller", saveLoadoutsAndKiller);
        
        localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
        localStorage.setItem("selectedKiller", selectedKiller);
    })

    const clearStorageButton = document.getElementById("settings-clear-storage-button");
    clearStorageButton.addEventListener("click", function() {
        if (confirm("Are you sure you want to clear your local storage? This will delete all of your settings including saved custom balancing.")) {
            localStorage.clear();
            location.reload();
        }
    });
}

/**
 * Responsible for setting the events for the Survivor perks. This also includes offerings, items, and add-ons. Essentially sets it so the search window is capable of displaying the proper data.
 */
function LoadSurvivorPerkSelectionEvents() {
    // Set on-click for perk selection
    var perks = document.getElementsByClassName("perk-slot");

    for (var i = 0; i < perks.length; i++) {
        let currentPerk = perks[i];

        currentPerk.addEventListener("click", function() {
            DebugLog(`Clicked on perk ${currentPerk.dataset.perkID} for survivor ${currentPerk.dataset.survivorID}`);
            var perkSearchContainer = document.getElementById("perk-search-container");
            perkSearchContainer.hidden = false;
            perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");
            
            var perkSearchModule = document.getElementById("perk-search-module-container");
            
            
            perkSearchModule.style.left = "50%";
            perkSearchModule.style.top = "50%";

            perkSearchContainer.dataset.targetSurvivor = currentPerk.dataset.survivorID;
            perkSearchContainer.dataset.targetPerk = currentPerk.dataset.perkID;
            perkSearchContainer.dataset.searchType = "perk";

            // Get perk search input
            var perkSearchInput = document.getElementById("perk-search-bar");
            perkSearchInput.value = "";
            perkSearchInput.focus();

            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = "Select a Perk...";
            
            // Reset search results
            ForcePerkSearch(perkSearchInput, "");
        });
    }

    var offerings = document.getElementsByClassName("offering-slot");
    for (var i = 0; i < offerings.length; i++) {
        let currentOffering = offerings[i];

        currentOffering.addEventListener("click", function() {
            DebugLog(`Clicked on offering for survivor ${currentOffering.dataset.survivorID}`);

            var perkSearchContainer = document.getElementById("perk-search-container");
            perkSearchContainer.hidden = false;
            perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");

            var perkSearchModule = document.getElementById("perk-search-module-container");
            perkSearchModule.style.left = "50%";
            perkSearchModule.style.top = "50%";

            perkSearchContainer.dataset.targetSurvivor = currentOffering.dataset.survivorID;
            perkSearchContainer.dataset.searchType = "offering";

            // Get perk search input
            var perkSearchInput = document.getElementById("perk-search-bar");
            perkSearchInput.value = "";
            perkSearchInput.focus();

            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = "Select an Offering...";

            // Reset search results
            ForceOfferingSearch(perkSearchInput, "");
        });
    }

    var items = document.getElementsByClassName("item-slot");
    for (var i = 0; i < items.length; i++) {
        let currentItem = items[i];

        currentItem.addEventListener("click", function() {
            DebugLog(`Clicked on item for survivor ${currentItem.dataset.survivorID}`);

            var perkSearchContainer = document.getElementById("perk-search-container");
            perkSearchContainer.hidden = false;
            perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");

            var perkSearchModule = document.getElementById("perk-search-module-container");
            perkSearchModule.style.left = "50%";
            perkSearchModule.style.top = "50%";

            perkSearchContainer.dataset.targetSurvivor = currentItem.dataset.survivorID;
            perkSearchContainer.dataset.searchType = "item";

            // Get perk search input
            var perkSearchInput = document.getElementById("perk-search-bar");
            perkSearchInput.value = "";
            perkSearchInput.focus();

            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = "Select an Item...";

            // Reset search results
            ForceItemSearch(perkSearchInput, "")
        });
    }

    var addons = document.getElementsByClassName("addon-slot");
    for (var i = 0; i < addons.length; i++) {
        let currentAddon = addons[i];
        let currentAddonIndex = currentAddon.dataset.survivorID; // Get the survivor index
    
        currentAddon.addEventListener("click", function() {
            const currentSurvivorItem = SurvivorItems[currentAddonIndex];

            if (currentSurvivorItem == undefined) {
                GenerateAlertModal("No Item Selected", "Please select an item before selecting addons.");
                return;
            }
            const itemType = currentSurvivorItem["Type"];

            DebugLog(`Clicked on addon ${currentAddon.innerText} for survivor ${currentAddon.dataset.survivorID}`);

            var perkSearchContainer = document.getElementById("perk-search-container");
            perkSearchContainer.hidden = false;
            perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");

            var perkSearchModule = document.getElementById("perk-search-module-container");
            perkSearchModule.style.left = "50%";
            perkSearchModule.style.top = "50%";

            perkSearchContainer.dataset.targetSurvivor = currentAddon.dataset.survivorID;
            perkSearchContainer.dataset.itemType = itemType;
            perkSearchContainer.dataset.addonSlot = currentAddon.dataset.addonSlot;
            perkSearchContainer.dataset.searchType = "addon";

            // Get perk search input
            var perkSearchInput = document.getElementById("perk-search-bar");
            perkSearchInput.value = "";
            perkSearchInput.focus();

            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = "Select an Addon...";

            // Reset search results
            ForceAddonSearch(perkSearchInput, "");
        });
    }

}

/**
 * Responsible for setting the events for the Killer perks. This also includes the offering and add-ons. Essentially sets it so the search window is capable of displaying the proper data.
 */
function LoadKillerPerkSelectionEvents() {
    // Set on-click for perk selection
    var perks = document.getElementsByClassName("killer-perk-slot");

    for (var i = 0; i < perks.length; i++) {
        let currentPerk = perks[i];
        DebugLog(currentPerk);

        currentPerk.addEventListener("click", function() {
            let curKillerName = Killers[selectedKiller];
            DebugLog(`Clicked on perk ${currentPerk.dataset.perkID} for killer ${curKillerName}`);
            
            var perkSearchContainer = document.getElementById("perk-search-container");
            perkSearchContainer.hidden = false;
            perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");

            var perkSearchModule = document.getElementById("perk-search-module-container");

            perkSearchModule.style.left = "50%";
            perkSearchModule.style.top = "50%";

            perkSearchContainer.dataset.targetKiller = selectedKiller;
            perkSearchContainer.dataset.targetPerk = currentPerk.dataset.perkID;
            perkSearchContainer.dataset.searchType = "perk";

            // Get perk search input
            var perkSearchInput = document.getElementById("perk-search-bar");
            perkSearchInput.value = "";
            perkSearchInput.focus();

            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = "Select a Perk...";

            // Reset search results
            ForcePerkSearch(perkSearchInput, "");
        });
    }

    var offering = document.getElementById("killer-offering-slot");

    offering.addEventListener("click", function() {
        DebugLog("Clicked on killer offering slot!");

        var perkSearchContainer = document.getElementById("perk-search-container");
        perkSearchContainer.hidden = false;
        perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");

        var perkSearchModule = document.getElementById("perk-search-module-container");
        perkSearchModule.style.left = "50%";
        perkSearchModule.style.top = "50%";

        perkSearchContainer.dataset.targetKiller = selectedKiller;
        perkSearchContainer.dataset.searchType = "offering";

        // Get perk search input
        var perkSearchInput = document.getElementById("perk-search-bar");
        perkSearchInput.value = "";
        perkSearchInput.focus();

        var perkTooltip = document.getElementById("perk-highlight-name");

        perkTooltip.innerText = "Select an Offering...";

        // Reset search results
        ForceOfferingSearch(perkSearchInput, "");
    });

    var addons = document.getElementsByClassName("killer-addon-slot");

    if (addons.length != 2) {
        console.error("Killer addon slots != 2! This should never happen!");
        return;
    }

    for (var i = 0; i < addons.length; i++) {
        let currentAddonElement = addons[i];

        currentAddonElement.addEventListener("click", function() {
            DebugLog(`Clicked on addon ${currentAddonElement.innerText} for killer ${Killers[selectedKiller]}`);

            var perkSearchContainer = document.getElementById("perk-search-container");
            perkSearchContainer.hidden = false;
            perkSearchContainer.classList.add("intro-blur-animation-class-0p5s");

            var perkSearchModule = document.getElementById("perk-search-module-container");
            perkSearchModule.style.left = "50%";
            perkSearchModule.style.top = "50%";

            perkSearchContainer.dataset.targetKiller = selectedKiller;
            perkSearchContainer.dataset.addonSlot = currentAddonElement.dataset.addonSlot;
            perkSearchContainer.dataset.searchType = "killer-addon";

            // Get perk search input
            var perkSearchInput = document.getElementById("perk-search-bar");
            perkSearchInput.value = "";
            perkSearchInput.focus();

            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = "Select an Addon...";

            // Reset search results
            ForceKillerAddonSearch(perkSearchInput, "");
        });
    }

}

/**
 * Sets up the events for the search menu and what will result in the window closing. This also sets up the event mainly for the search bar. As a result, should only ever be called once.
 */
function LoadPerkSearchEvents() {
    const perkSearchContainer = document.getElementById("perk-search-container");

    // Code to exit search menu
    perkSearchContainer.addEventListener("click", function(event) {
        if(event.target.tagName === "IMG" || event.target.classList.contains("background-blur"))
            perkSearchContainer.hidden = true;
    });

    const perkSearchBar = document.getElementById("perk-search-bar");

    // Code to start search
    perkSearchBar.addEventListener("input", function() {
        // Get search type from dataset
        var searchType = perkSearchContainer.dataset.searchType;

        switch (searchType) {
            case "perk":
                ForcePerkSearch(perkSearchBar, perkSearchBar.value);
                break;
            case "offering":
                ForceOfferingSearch(perkSearchBar, perkSearchBar.value);
                break;
            case "item":
                ForceItemSearch(perkSearchBar, perkSearchBar.value);
                break;
            case "addon":
                ForceAddonSearch(perkSearchBar, perkSearchBar.value);
                break;
            case "killer-addon":
                ForceKillerAddonSearch(perkSearchBar, perkSearchBar.value);
                break;
        }
    });
}