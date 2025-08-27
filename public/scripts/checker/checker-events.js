/*
Name:
    checker-events.js
Purpose:
    This file is designed for the purpose of handling all of the event setup for the balance checker.
    Many of the methods in this file are designed to only be called once. This is to prevent multiple event listeners from being added to the same element.
    Please see the method mapper for more information.
*/

function SetBalancingSelectButtonEvents() {
    const openButton = document.getElementById("balancing-select-button");

    const balancingSelectContainer = document.getElementById("balancing-select-container");
    
    let balanceSearchInput = document.getElementById("balancing-select-search-input");
    
    balanceSearchInput.addEventListener("input", function() {
        let searchQuery = balanceSearchInput.value;

        let optionsContainer = document.getElementById("balancing-select-options-container");
        let balanceOptions = optionsContainer.children;

        PopulateBalancingSelectMenuFromSearch(searchQuery.toLowerCase());
    });

    openButton.addEventListener("click", function() {
        balancingSelectContainer.hidden = false;

        let balancingSelectMenu = document.getElementById("balancing-select-menu");
        delete balancingSelectMenu.dataset.proposedPresetID;

        let closeButton = document.getElementById("balancing-select-close-button");
        closeButton.innerText = "Cancel";

        let balanceSubtitleText = document.getElementById("balancing-select-subtitle");
        const currentBalanceName = GetBalancePresetByID(currentBalancingIndex)["Name"];

        balanceSubtitleText.innerHTML = `Current Preset: <b><u>${currentBalanceName}</u></b><br>` +
            `Select your desired balancing preset from the options below:`;

        PopulateBalancingSelectMenu();

        balanceSearchInput.value = "";
        balanceSearchInput.focus();
    })

    const closeButton = document.getElementById("balancing-select-close-button");

    closeButton.addEventListener("click", function() {
        balancingSelectContainer.hidden = true;

        RemoveAllBalancingSelectMenuChildren();
        
        let balancingSelectMenu = document.getElementById("balancing-select-menu");
        let proposedPresetID = balancingSelectMenu.dataset.proposedPresetID;

        if (proposedPresetID == undefined) { return; }

        let settingsMenu = document.getElementById("settings-menu");
        settingsMenu.dataset.balancingHasChanged = "true";

        currentBalancingIndex = proposedPresetID
        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

        TryLoadBalanceProfileFromPresetID(currentBalancingIndex,
            function() {
                TrySetCurrentBalancing();
            },
            function() {
                console.error("Could not set balancing!")
            }
        );

        if (!ValidateCustomBalancing(GetBalancePresetByID(currentBalancingIndex)["Balancing"])) {
            GenerateAlertModal(
                "Error",
                "This default balance profile is invalid, selecting the default balance profile. Please report this to the GitHub issues page or the Discord server.",
                function() {
                    currentBalancingIndex = 0;
                    localStorage.setItem("currentBalancingIndex", currentBalancingIndex);
                    
                    alert("Balance profile reset to default. Close this alert to continue.");
        
                    // Refresh the page
                    location.reload();
                }
            )
        }
        currentBalancing = GetBalancePresetByID(currentBalancingIndex)["Balancing"];
    });

    let customBalanceCheckbox = document.getElementById("custom-balancing-checkbox");

    customBalanceCheckbox.addEventListener("change", function() {
        customBalanceOverride = customBalanceCheckbox.checked;
        localStorage.setItem("customBalanceOverride", customBalanceOverride);

        let customBalancingContainer = document.getElementById("custom-balance-select");
        let selectPresetButton = document.getElementById("balancing-select-button");

        if (customBalanceOverride) {
            // Show custom balancing
            selectPresetButton.hidden = true;
            
            customBalancingContainer.hidden = false;
        } else {
            // Hide custom balancing
            selectPresetButton.hidden = false;

            customBalancingContainer.hidden = true;
            customBalancingContainer.innerHTML = "";
        }

        let settingsMenu = document.getElementById("settings-menu");
        settingsMenu.dataset.balancingHasChanged = "true";
        settingsMenu.dataset.setCustomBalanceOverride = customBalanceOverride;
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

        if(selectedRole == 0){
            document.getElementById("import-button").style.display = "block"
            document.getElementById("export-button").style.display = "block"
        } else {
            document.getElementById("import-button").style.display = "none"
            document.getElementById("export-button").style.display = "none"
        }
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

    importButton.addEventListener("click", () => {
        document.getElementById("import-image").click()
        console.log("image click");
    })
    document.getElementById("import-image").addEventListener("change", async function(event){
        const file = event.target.files[0]
        console.log("file targeting done")
        if(!file) {
            console.log("file error");
            GenerateAlertModal("Error", "An error occurred while importing your image.")
            console.error("Error importing image: " + this.status)
            return;
        }

        console.log("no error")

        GenerateAlertModal("Importing Image...", "Please wait while your loadout image is importing...", undefined, false, true);

        console.log("modal generated");
        
        const formData = new FormData()
        formData.append("image", file)

        var xhttp = new XMLHttpRequest()

        if(xhttp.readyState !== 4){
            xhttp.abort()
        }
        xhttp.responseType = "json"

        xhttp.onreadystatechange = function(){
            if(this.readyState == 4){
                document.getElementById("alert-container").hidden = true

                switch(this.status){
                    case 200:
                        const result = this.response
                        console.log("Image Extractor:", result)

                        let survCpt = 0
                        for(const loadout of result.survLoadouts){
                            let cpt = 0
                            for(const perk of loadout.perks){
                                if(perk == "blank.png"){
                                    SurvivorPerks[survCpt][cpt] = undefined
                                }else{
                                    SurvivorPerks[survCpt][cpt] = GetPerkByPNGFileName(perk)
                                }
                                cpt++
                            }

                            if(loadout.offering == "blank.png"){
                                SurvivorOfferings[survCpt] = undefined
                            }else{
                                SurvivorOfferings[survCpt] = GetOfferingByPNGFileName(loadout.offering)
                            }

                            if(loadout.item == "blank.png"){
                                SurvivorItems[survCpt] = undefined
                            }else{
                                SurvivorItems[survCpt] = GetItemByPNGFileName(loadout.item)

                                cpt = 0
                                for(const addon of loadout.addons){
                                    if(addon == "blank.png"){
                                        SurvivorAddons[survCpt][cpt] = undefined
                                    }else{
                                        SurvivorAddons[survCpt][cpt] = GetAddonByPNGFileName(addon, SurvivorItems[survCpt].Type)
                                    }
                                    cpt++
                                }
                            }

                            survCpt++
                        }

                        let estimatedKillerChoice = result.killer;
                        
                        let finalChoice = TryGetKillerByNameApproximation(estimatedKillerChoice);
                        
                        if (importKillerChoice) {
                            SetSelectedKillerByName(finalChoice["Name"]);
                        }



                        if (Config.saveBuilds && saveLoadoutsAndKiller) {
                            localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
                            localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
                            localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
                            localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
                        }

                        UpdatePerkUI()
                        CheckForBalancingErrors()

                        document.getElementById("import-image").value = "";
                    break
                    default:
                        GenerateAlertModal("Error", "An error occurred while importing your image.")
                        console.error("Error importing image: " + this.status)
                }
            }
        }

        xhttp.open("POST", "/image-extractor", true);
        xhttp.send(formData);
    })

    exportButton.addEventListener("click", function() {
        const compressedText = GetExportData();

        let textToCopy = compressedText;

        // Determine whether it is short enough to be a URL encoded.
        const encodedText = encodeURIComponent(compressedText);
        let isURL = false;
        if (encodedText.length < maxImportURLLength) {
            let url = window.location.href.split("?")[0] + "?loadout=" + encodedText;
            textToCopy = url;

            isURL = true;
        }

        // Copy exportData to clipboard
        var wasErr = false;
        try {
            if (isURL) {
                navigator.clipboard.writeText(textToCopy);
            } else {
                throw error;
            }
        } catch (error) {
            wasErr = true;
        }

        if (!wasErr) {
            if (isURL) {
                GenerateAlertModal(
                    "Exported as URL and Copied!",
                    `Your import code has been copied as a link to your clipboard. Share this link and others can directly import it!<br><br>Import URL:<br> <b><span class='import-code-preview'>${textToCopy}</span></b>`
                );
            }
            return;
        }

        if (isURL) {
            GenerateAlertModal(
                "Exported as URL",
                `Your import code has been generated as a URL, but copying to the clipboard was unsuccessful. Please copy the URL manually.<br><br>Import URL:<br> <b><span class='import-code-preview'>${textToCopy}</span></b>`
            );
        } else {
            GenerateAlertModal(
                "Export Unsuccessful",
                `Exporting this loadout as a URL was unsuccessful due to its size. It is likely custom balancing is enabled and causing the issue.<br><br>Please consider using an official balancing preset to use the exporting feature.`
            );
        }
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

        let currentName = Killers[newIndex].Name;
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
            UpdateAntiFacecampUI();
            

            ScrollToSelectedKiller();
        });
    }
}

/**
 * Responsible for setting the events for the settings menu, including the checkboxes. As a result, should only ever be called once.
 */
function LoadSettingsEvents() {
    // Load settings button
    let settingsButton = document.getElementById("settings-button");
    settingsButton.addEventListener("click", function() {
        var settingsContainer = document.getElementById("settings-container");
        settingsContainer.hidden = !settingsContainer.hidden;
        
        let settingsBlur = document.getElementById("settings-blur");
        settingsBlur.classList.remove("background-blur");
        settingsBlur.classList.remove("background-outro-blur");
        settingsBlur.classList.add("background-blur");

        let settingsMenu = document.getElementById("settings-menu");
        settingsMenu.classList.remove("intro-blur-animation-class-1p0s");
        settingsMenu.classList.remove("outro-blur-animation-class-0p5s");
        settingsMenu.classList.add("intro-blur-animation-class-1p0s");
    });

    let settingsCancelButton = document.getElementById("settings-cancel-button");
    settingsCancelButton.addEventListener("click", function() {

        if (customBalanceOverride) {
            currentBalancing = GetCustomBalancing();

            // Save custom balancing to local storage
            localStorage.setItem("currentBalancing", JSON.stringify(currentBalancing));

            //currentBalancingIndex = -1;
        }

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

        if (settingsMenu.dataset.balancingHasChanged === "true") {
            UpdateBalanceSelectionUI();
            UpdateAntiFacecampUI();
            delete settingsMenu.dataset.balancingHasChanged;
        }

        if (settingsMenu.dataset.setCustomBalanceOverride === "false") {
            TryLoadBalanceProfileFromPresetID(currentBalancingIndex,
                function() {
                    TrySetCurrentBalancing();
                    UpdateBalanceSelectionUI();
                    UpdateAntiFacecampUI();
                },
                function() {
                    console.error("Could not set balancing!")
                }
            );
        }
        delete settingsMenu.dataset.setCustomBalanceOverride;

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

    const loadKillerChoiceImportCheckbox = document.getElementById("import-killer-choice-input");
    loadKillerChoiceImportCheckbox.addEventListener("change", function() {
        importKillerChoice = loadKillerChoiceImportCheckbox.checked;
        localStorage.setItem("importKillerChoice", importKillerChoice);        
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
            let curKillerName = Killers[selectedKiller].Name;
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
            DebugLog(`Clicked on addon ${currentAddonElement.innerText} for killer ${Killers[selectedKiller].Name}`);

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

/**
 * Applies the related selection events to the option node.
 * 
 * It then returns the updated node (as JS is pass-by-value (unfortunately))
 * @param {Node} optionNode The node to have the events applied to.
 * @param {Number} presetIndex The index of the balance preset in the BalancePresets array.
 */
function ApplyBalancingOptionEvents(optionNode, presetIndex) {
    if (optionNode == undefined) { return null; }

    optionNode.addEventListener("click", function() {
        /*
        1. Set balancing select menu dataset's proposed new ID to the preset ID.
        2. Go through all existing balancing options and remove the "proposed-league-selection" class.
        3. Add the "proposed-league-selection" class to this option.
        */
        let balancingSelectMenu = document.getElementById("balancing-select-menu");
        let closeButton = document.getElementById("balancing-select-close-button");

        if (optionNode.dataset.balancePresetID == balancingSelectMenu.dataset.proposedPresetID) {
            delete balancingSelectMenu.dataset.proposedPresetID;
            optionNode.classList.remove("proposed-league-selection");
            
            closeButton.innerText = "Cancel";
            return;
        }

        const optionsContainer = document.getElementById("balancing-select-options-container");
        for (let child of optionsContainer.children) {
            child.classList.remove("proposed-league-selection");
        }

        balancingSelectMenu.dataset.proposedPresetID = optionNode.dataset.balancePresetID;

        optionNode.classList.add("proposed-league-selection");

        closeButton.innerText = "Confirm Changes";
    });

    return optionNode;
}

function SetAntiFacecampBadgeEvents() {
    let timer = undefined;

    const anticampBadge = document.getElementById("anticamp-badge");
    const anticampTooltip = document.getElementById("anticamp-tooltip");

    
    let badgePos = getOffset(anticampBadge);
    
    anticampTooltip.style.position = "absolute";

    anticampBadge.addEventListener("mouseenter", function(event) {
        anticampTooltip.innerText = anticampBadge.ariaLabel;

        anticampTooltip.style.left = event.clientX;
        anticampTooltip.style.top = event.clientY;

        anticampTooltip.hidden = false;
    });

    anticampBadge.addEventListener("mouseleave", function(event) {
        anticampTooltip.innerText = "";
        
        anticampTooltip.hidden = true;

        clearTimeout(timer);
    });
}