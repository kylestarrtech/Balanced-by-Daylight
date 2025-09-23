function main() {
    document.body.addEventListener("mousemove", UpdateMousePos);

    // Get config
    GetConfig();

    // Initialize Survivor Perks
    for (var i = 0; i < SurvivorPerks.length; i++) {
        SurvivorPerks[i] = [
            undefined,
            undefined,
            undefined,
            undefined
        ];
    }    

    // Loads survivor perks from local storage if enabled
    if (Config.saveBuilds) {
        document.getElementById("save-loadouts-killer-container").style.display = "block";

        if(saveLoadoutsAndKiller){
            if(localStorage.getItem("selectedKiller")) selectedKiller = parseInt(localStorage.getItem("selectedKiller"));
            if(localStorage.getItem("SurvivorPerks")) SurvivorPerks = JSON.parse(localStorage.getItem("SurvivorPerks"));
            if(localStorage.getItem("SurvivorOfferings")) SurvivorOfferings = JSON.parse(localStorage.getItem("SurvivorOfferings"));
            if(localStorage.getItem("SurvivorItems")) SurvivorItems = JSON.parse(localStorage.getItem("SurvivorItems"));
            if(localStorage.getItem("SurvivorAddons")) SurvivorAddons = JSON.parse(localStorage.getItem("SurvivorAddons"));

            if (localStorage.getItem("KillerPerks")) KillerPerks = JSON.parse(localStorage.getItem("KillerPerks"));

            if (localStorage.getItem("KillerOffering")) {
                let rawSave = localStorage.getItem("KillerOffering");

                if (rawSave == "undefined") {
                    KillerOffering = undefined;
                } else {
                    KillerOffering = JSON.parse(rawSave);
                }
            }
            
            if (localStorage.getItem("KillerAddons")) KillerAddons = JSON.parse(localStorage.getItem("KillerAddons"));

            ScrollToSelectedKiller();
        }
    }

    if (localStorage.getItem("selectedRole")) { selectedRole = parseInt(localStorage.getItem("selectedRole")); }

    UpdateRoleSwapIcon();

    // Update Perk Page
    UpdatePerkUI();

    // Update Killer Selection UI
    UpdateKillerSelectionUI();

    // Update Role Selection Header UI
    UpdateRoleSelectionHeaderUI();

    // Load button events
    LoadButtonEvents();

    // Update balancing dropdown
    SetBalancingSelectButtonEvents();

    // Set current balancing

    // Sets balancing to either local storage or default, in this case we're doing local storage since it's default balancing.
    currentBalancingIndex = 0;
    if(localStorage.getItem("currentBalancingIndex")) currentBalancingIndex = parseInt(localStorage.getItem("currentBalancingIndex"));

    // Set balancing to the one sent in URL if there is one
    const params = new URLSearchParams(window.location.search);
    if(params.get("balancing")){
        currentBalancingIndex = params.get("balancing");

        // Remove the balancing param from the URL
        // This is done because if the ID is invalid the site refreshes, causing an infinite loop.
        // This way, if the ID is invalid it only happens once.
        // If the user wants to try again they can just re-add the param.
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("balancing");
        const newUrl = window.location.pathname + '?' + newParams.toString();
        window.history.replaceState({}, document.title, newUrl);
    }

    TryLoadBalanceProfileFromPresetID(currentBalancingIndex,
        function() {
            TrySetCurrentBalancing();
        },
        function() {
            console.error("Could not set balancing!");
        }
    );

    let loadDefaultBalance = true;
    // Load custom balancing if enabled
    if(localStorage.getItem("customBalanceOverride")) {
        // Custom balancing override is valid

        // Is it enabled?
        if (localStorage.getItem("customBalanceOverride") == "true") {
            // Custom balancing is enabled
            customBalanceOverride = true;
            loadDefaultBalance = false;

            // Set balancing to custom balancing if it's valid
            if (localStorage.getItem("currentBalancing") &&
                ValidateCustomBalancing(JSON.parse(localStorage.getItem("currentBalancing")))) {
                    
                currentBalancing = JSON.parse(localStorage.getItem("currentBalancing"));
                loadDefaultBalance = false;
            }

        }
    }

    // Load default balancing if custom balancing is not enabled/not saved.
    if (loadDefaultBalance) {
            // Set balancing to said index.
        if (GetBalancePresetByID(currentBalancingIndex) == undefined) {
            if (currentBalancingIndex == 0) {
                GenerateAlertModal("Critical Backend Error", `Could not find the associated balancing preset, but the balancing preset is already set to the default. This should <b>never</b> happen.<br><br>If this occurs, please contact "shaders" on Discord immediately, use the #support channel on the Balanced by Daylight Discord server, or contact @SHADERSOP on Twitter/X via a public tweet.<br><br><a href="https://discord.gg/XC5spf5GkA">Discord Server</a>`,
                    undefined,
                    false,
                    true
                );
                return;
            }

            console.error("Balance profile of saved selection is undefined, defaulting to 0.");
            currentBalancingIndex = 0;
            localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

            GenerateAlertModal("Error", "Could not find the balance preset previously selected - this is likely due to a change in the balance presets. Defaulting to the first balancing preset. Closing this alert reloads the page.",
                closeCallback=function() {
                    location.reload();
                }
            );
            
        }
        //currentBalancing = GetBalancePresetByID(currentBalancingIndex)["Balancing"];
        TrySetCurrentBalancing();
    }

    // Update Balancing Selection UI
    UpdateBalanceSelectionUI();

    // Set Anti-Facecamp Badge Events
    SetAntiFacecampBadgeEvents();

    // Update Anti-Facecamp UI
    UpdateAntiFacecampUI();

    // Update the checkbox to show non-banned perks in the search
    document.getElementById("only-non-banned").checked = onlyShowNonBanned;

    // Update the auto-show notes checkbox
    document.getElementById("auto-show-notes").checked = showNotesOnLaunch;

    // Update the checkbox to save loadouts and killer selected
    document.getElementById("save-loadouts-killer").checked = saveLoadoutsAndKiller;

    document.getElementById("import-killer-choice-input").checked = importKillerChoice;

    // Update the custom balance checkbox to show if custom balancing is enabled
    document.getElementById("custom-balancing-checkbox").checked = customBalanceOverride;

    // Update the custom balance text area to show the current custom balancing
    if (customBalanceOverride) {
        document.getElementById("custom-balance-select").value = JSON.stringify(currentBalancing, null, 4);

        // Show the custom balancing text area
        document.getElementById("custom-balance-select").hidden = false;
    }

    AttemptApplyURLImport();

    CheckForBalancingErrors();
}

/**
 * A function to load all button events.
 * Nested with other functions to keep things clean.
 */
function LoadButtonEvents() {
    LoadSettingsEvents();

    LoadRoleSwapEvents();

    SetKillerCharacterSelectEvents();

    LoadPerkSelectionEvents();

    LoadImportEvents();

    LoadImageGenEvents();

    LoadClearLoadoutButton();

    LoadPerkSearchEvents();
}

/**
 * A bridge between selecting survivor/killer perk selection events depending on role selected.
 */
function LoadPerkSelectionEvents() {
    if (selectedRole == 0) {
        LoadSurvivorPerkSelectionEvents();
    } else {
        LoadKillerPerkSelectionEvents();
    }
}

/**
 * A bridge between checking the balancing for the survivor role or the killer role.
 */
function CheckForBalancingErrors() {
    if (selectedRole == 0) {
        CheckForSurvivorBalanceErrors();
    } else {
        CheckForKillerBalanceErrors();
    }
}