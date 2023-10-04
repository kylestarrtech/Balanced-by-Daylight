var debugging = true;
var overrideStackTrace = false;

var Perks = null;
var Killers = null;
var Survivors = null;
var Maps = null;
var Addons = null;
var Offerings = null;

var Config = null;

var AllDataLoaded = false;

var BalancePresets = [
    {
        Name: "Outrun the Fog (OTF)",
        Path: "BalancingPresets/OTF.json",
        Balancing: {}
    },
    {
        Name: "Dead by Daylight League (DBDL)",
        Path: "BalancingPresets/DBDL.json",
        Balancing: {}
    }
]
var currentBalancingIndex = 0;
var customBalanceOverride = false;

var currentBalancing = {};

mousePos = [0, 0];
function UpdateMousePos(event) {
    mousePos = [event.clientX, event.clientY];
}

MasterErrorList = [
    
]

SurvivorPerks = [
    [
        null, // Perk 1
        null, // Perk 2
        null, // Perk 3
        null  // Perk 4
    ],
    [
        null, // Perk 1
        null, // Perk 2
        null, // Perk 3
        null  // Perk 4
    ],
    [
        null, // Perk 1
        null, // Perk 2
        null, // Perk 3
        null  // Perk 4
    ],
    [
        null, // Perk 1
        null, // Perk 2
        null, // Perk 3
        null  // Perk 4
    ]
]

selectedKiller = 0;
currentBalancingIndex = 0;

var socket = null;
var RoomID = undefined;

function main() {
    document.body.addEventListener("mousemove", UpdateMousePos);

    // Get config
    GetConfig();

    if (Config.multiplayerEnabled) {
        socket = io();
    }

    // Initialize Survivor Perks
    for (var i = 0; i < SurvivorPerks.length; i++) {
        SurvivorPerks[i] = [
            undefined,
            undefined,
            undefined,
            undefined
        ];
    }

    // Load data
    GetPerks();

    // Update Perk Page
    UpdatePerkUI();

    // Update Killer Selection UI
    UpdateKillerSelectionUI();

    // Load button events
    LoadButtonEvents();

    // Update balancing dropdown
    UpdateBalancingDropdown();

    // Set current balancing
    currentBalancingIndex = 0;
    currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];

    CheckForBalancingErrors();
}

function GetConfig() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    Config = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting config: " + this.status);
            }
        }
    }
    xhttp.open("GET", "config", false);
    xhttp.send();
}

/**
 * A function to update the perk frontend.
 */
function UpdatePerkUI() {
    // Get the builds container
    var buildsContainer = document.getElementById("survivor-builds-container");

    // Get all children
    var children = buildsContainer.children;

    // Loop through all children
    validChildI = 0;
    for (var i = 0; i < children.length; i++) {
        let currentChild = children[i];
        if (!currentChild.classList.contains("survivor-build-component")) { continue; }
        
        currentChild.innerHTML = "";

        // Get current survivor perks
        let currentSurvivorPerks = SurvivorPerks[validChildI];

        // Loop through all perks
        for (var j = 0; j < currentSurvivorPerks.length; j++) {
            let currentPerk = currentSurvivorPerks[j];

            //DebugLog(`${j}/${i} - Current Perk: ${currentPerk}`);

            ImgSrc = "";
            try {
                ImgSrc = currentPerk["icon"];
            } catch (error) {
                ImgSrc = "public/Perks/blank.png";
            }

            let perkElement = document.createElement("div");
            perkElement.classList.add("perk-slot");

            perkElement.dataset.survivorID = validChildI;
            perkElement.dataset.perkID = j;

            let perkImg = document.createElement("img");
            perkImg.src = ImgSrc;
        
            perkElement.appendChild(perkImg);
            currentChild.appendChild(perkElement);
        }

        validChildI++;
    }

    LoadPerkSelectionEvents();
}

function UpdateKillerSelectionUI() {
    var selectedKillerTitle = document.getElementById("selected-killer-title");
    selectedKillerTitle.innerText = `Selected Killer: ${Killers[selectedKiller]}`;
}

function UpdateBalancingDropdown() {
    var balancingDropdown = document.getElementById("balancing-select");

    balancingDropdown.innerHTML = "";

    for (var i = 0; i < BalancePresets.length; i++) {
        let currentPreset = BalancePresets[i];

        let optionElement = document.createElement("option");
        optionElement.innerText = currentPreset["Name"];
        optionElement.value = i;

        balancingDropdown.appendChild(optionElement);
    }

    balancingDropdown.addEventListener("change", function() {
        currentBalancingIndex = parseInt(balancingDropdown.value);

        currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];
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

        var customBalancingContainer = document.getElementById("custom-balance-select");
        var customBalanceLabel = document.getElementById("balance-mode-label");
        var customBalanceDropdown = document.getElementById("balancing-select");

        if (customBalanceOverride) {
            // Show custom balancing
            customBalancingContainer.hidden = false;
            customBalanceDropdown.hidden = true;
            customBalanceLabel.hidden = true;
        } else {
            // Hide custom balancing
            customBalancingContainer.hidden = true;
            customBalanceDropdown.hidden = false;
            customBalanceLabel.hidden = false;

            customBalancingContainer.innerHTML = "";
        }
    });
}

/**
 * A function to load all button events.
 * Nested with other functions to keep things clean.
 */
function LoadButtonEvents() {
    LoadSettingsEvents();

    SetKillerCharacterSelectEvents();

    LoadPerkSelectionEvents();

    LoadPerkSearchEvents();

    LoadRoomEvents();
}

function LoadRoomEvents() {
    let roomIDInput = document.getElementById("room-code-input");
    let joinRoomButton = document.getElementById("join-room-button");

    joinRoomButton.addEventListener("click", function() {
        if (roomIDInput.value == "") {
            GenerateAlertModal("Room ID Empty", "Please enter a room ID.");
            return;
        }

        socket.emit("clientJoinRoom", roomIDInput.value);
    });

    let leaveRoomButton = document.getElementById("leave-room-button");

    leaveRoomButton.addEventListener("click", function() {
        socket.emit("clientLeaveRoom", CreateStatusObject());
    });

    let closeRoomButton = document.getElementById("close-room-button");

    closeRoomButton.addEventListener("click", function() {
        let roomContainer = document.getElementById("room-container");
        roomContainer.hidden = true;
    });
}

function SetKillerCharacterSelectEvents() {
    var GetCharacterSelectButtons = document.getElementsByClassName("character-select-button");

    for (var i = 0; i < GetCharacterSelectButtons.length; i++) {
        let newIndex = i;
        let currentButton = GetCharacterSelectButtons[newIndex];

        let currentName = Killers[newIndex];
        currentButton.addEventListener("click", function() {
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

            CheckForBalancingErrors();
            UpdateKillerSelectionUI();

            SendRoomDataUpdate();
        });
    }
}

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
            currentBalancingIndex = -1;
        } else {
            currentBalancingIndex = parseInt(document.getElementById("balancing-select").value);
            currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];
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

        CheckForBalancingErrors();
        SendRoomDataUpdate();
    });
}

function LoadPerkSelectionEvents() {
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
            
            // If perk module is out of bounds, move it back in bounds
            if (parseInt(perkSearchModule.style.left) + parseInt(perkSearchModule.style.width) > window.innerWidth) {
                perkSearchModule.style.left = window.innerWidth - parseInt(perkSearchModule.style.width);
            }
            if (parseInt(perkSearchModule.style.top) + parseInt(perkSearchModule.style.height) > window.innerHeight) {
                perkSearchModule.style.top = window.innerHeight - parseInt(perkSearchModule.style.height);
            }

            perkSearchContainer.dataset.targetSurvivor = currentPerk.dataset.survivorID;
            perkSearchContainer.dataset.targetPerk = currentPerk.dataset.perkID;

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
}

function LoadPerkSearchEvents() {
    var perkSearchContainer = document.getElementById("perk-search-container");

    perkSearchContainer.addEventListener("click", function() {
        perkSearchContainer.hidden = true;
    });

    var perkSearchBar = document.getElementById("perk-search-bar");

    perkSearchBar.addEventListener("input", function() {
        ForcePerkSearch(perkSearchBar, perkSearchBar.value);
    });
}

function ForcePerkSearch(perkSearchBar, value = "") {
    var searchResults = SearchForPerks(perkSearchBar.value, true);

    var perkSearchResultsContainer = document.getElementById("perk-search-results-module");

    perkSearchResultsContainer.innerHTML = "";

    // Add a blank perk to the top of the list
    let blankPerk = document.createElement("div");
    blankPerk.classList.add("perk-slot-result");

    let blankImg = document.createElement("img");
    blankImg.src = "public/Perks/blank.png";

    blankPerk.appendChild(blankImg);
    perkSearchResultsContainer.appendChild(blankPerk);

    blankPerk.addEventListener("click", function() {
        var targetSurvivor = parseInt(perkSearchContainer.dataset.targetSurvivor);
        var targetPerk = parseInt(perkSearchContainer.dataset.targetPerk);

        SurvivorPerks[targetSurvivor][targetPerk] = undefined;

        UpdatePerkUI();

        perkSearchContainer.dataset.targetSurvivor = undefined;
        perkSearchContainer.dataset.targetPerk = undefined;

        CheckForBalancingErrors();
    });

    blankPerk.addEventListener("mouseover", function() {
        var perkTooltip = document.getElementById("perk-highlight-name");

        perkTooltip.innerText = "Blank Perk";
    });
    
    for (var i = 0; i < searchResults.length; i++) {
        let currentPerk = searchResults[i];

        let perkElement = document.createElement("div");
        perkElement.classList.add("perk-slot-result");

        perkElement.dataset.perkID = currentPerk["id"];


        let perkImg = document.createElement("img");
        perkImg.src = currentPerk["icon"];

        perkElement.appendChild(perkImg);
        perkSearchResultsContainer.appendChild(perkElement);

        var perkSearchContainer = document.getElementById("perk-search-container");

        perkElement.addEventListener("click", function() {
            var targetSurvivor = parseInt(perkSearchContainer.dataset.targetSurvivor);
            var targetPerk = parseInt(perkSearchContainer.dataset.targetPerk);

            SurvivorPerks[targetSurvivor][targetPerk] = currentPerk;

            UpdatePerkUI();

            perkSearchContainer.dataset.targetSurvivor = undefined;
            perkSearchContainer.dataset.targetPerk = undefined;

            CheckForBalancingErrors();

            SendRoomDataUpdate();
        });

        perkElement.addEventListener("mouseover", function() {
            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerText = currentPerk["name"];
        });
    }
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

/* -------------------------------------- */
/* ------------- GET DATA --------------- */
/* -------------------------------------- */

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
            GetBalancing();
        }
    }
    xhttp.open("GET", "Offerings.json", false);
    xhttp.send();
}

function GetBalancing() {
    // Subtract one due to customs
    for (var i = 0; i < BalancePresets.length; i++) {
        let currentPreset = BalancePresets[i];

        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                switch (this.status) {
                    case 200:
                        currentPreset["Balancing"] = JSON.parse(this.responseText);
                    break;
                    default:
                        console.error("Error getting balancing: " + this.status);
                }
            }
        }
        xhttp.open("GET", currentPreset["Path"], false);
        xhttp.send();
    }

    AllDataLoaded = true;
}

function GetCustomBalancing() {
    var customBalanceInput = document.getElementById("custom-balance-select");
    var customBalanceLabel = document.getElementById("balance-mode-label");
    var customBalanceDropdown = document.getElementById("balancing-select");

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

        var customBalanceCheckbox = document.getElementById("custom-balancing-checkbox");
        customBalanceCheckbox.checked = false;
        customBalanceOverride = customBalanceCheckbox.checked;
        
        currentBalancingIndex = 0;

        currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];
    }

    return customBalanceObj;
}

/* -------------------------------------- */
/* --------- BALANCE CHECKING ----------- */
/* -------------------------------------- */

/**
 * A function to check the balance of the current set of builds.
 */
function CheckBuildsBalance() {

}

/**
 * A function to check how many times perks are used in the current set of builds.
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

            // Loop through other builds
            for (var k = i+1; k < builds.length; k++) {
                var perkRepeatAmount = 0;

                let otherBuild = builds[k];

                if (otherBuild == undefined) { continue; }

                var perkRepeated = BuildHasPerk(currentPerk["id"], otherBuild);
                DebugLog(`Checking if ${currentPerk["name"]} is repeated in build ${k} (on build ${i})`);

                if (perkRepeated) {
                    perkRepeatAmount++;
                }

                DebugLog(perkRepeated);
                DebugLog(currentBalancing.MaxPerkRepetition)
                if (perkRepeatAmount >= currentBalancing.MaxPerkRepetition) {

                    ErrorLog.push(GenerateErrorObject(
                        "Perk Repetition",
                        `Perk ${currentPerk["name"]} is repeated ${perkRepeatAmount} times in the Survivor builds.`,
                        console.trace(),
                        "iconography/Error.png"
                    ))
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
                ErrorLog.push(
                    GenerateErrorObject(
                        "Duplicate Perk",
                        `Perk <b>${currentPerk["name"]}</b> is duplicated in <b>Survivor #${survIndex+1}</b>'s build.`,
                        console.trace(),
                        "iconography/CriticalError.png"
                    )
                )
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

function ComboIsBannedInOverride(build, override, survivorIndex) {
    let ErrorList = [];

    let combos = GetAllBuildCombos(build);

    // DebugLog("COMBOS: ");
    // DebugLog(combos);

    // Loop through combos
    for (var i = 0; i < combos.length; i++) {
        
        // Get current combo
        let currentCombo = combos[i];

        // Check if combo is explicitly banned
        for (var j = 0; j < override.SurvivorComboPerkBans.length; j++) {
            let currentBannedCombo = override.SurvivorComboPerkBans[j];

            if (currentBannedCombo == undefined) { continue; }

            // Check if current combo is banned
            if (ComboIsEqual(currentCombo, currentBannedCombo)) {
                ErrorList.push(
                    GenerateErrorObject(
                        "Banned Combo",
                        `Combo <b>${PrintCombo(currentCombo)}</b> is banned against <b>${override.Name}</b>. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                        console.trace(),
                        "iconography/Error.png"
                    )
                )
            }
        }

        // Check if combo is whitelisted
        var comboWhitelisted = false;
        // DebugLog(override);
        // DebugLog(override.SurvivorWhitelistedComboPerks);
        for (var j = 0; j < override.SurvivorWhitelistedComboPerks.length; j++) {
            let currentWhitelistedCombo = override.SurvivorWhitelistedComboPerks[j];

            if (currentWhitelistedCombo == undefined) { continue; }

            // Check if current combo is whitelisted
            if (ComboIsEqual(currentCombo, currentWhitelistedCombo)) {
                comboWhitelisted = true;
            }
        }

        // Check if combo is banned by tier
        for (var j = 0; j < override.SurvivorBalanceTiers.length; j++) {
            let currentTierIndex = override.SurvivorBalanceTiers[j];
            let currentTier = currentBalancing.Tiers[currentTierIndex];

            if (currentTier == undefined) { continue; }

            // Check if current combo is banned
            for (var k = 0; k < currentTier.SurvivorComboPerkBans.length; k++) {
                let currentBannedCombo = currentTier.SurvivorComboPerkBans[k];

                if (currentBannedCombo == undefined) { continue; }

                // Check if current combo is banned
                if (ComboIsEqual(currentCombo, currentBannedCombo)) {
                    ErrorList.push(
                        GenerateErrorObject(
                            "Banned Combo",
                            `Combo <b>${PrintCombo(currentCombo)}</b> is banned in <b>${currentTier.Name}</b> Tier Balancing. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                            console.trace(),
                            "iconography/Error.png"
                        )
                    )
                }
            }
        }
    }

    return ErrorList;
}

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
 * A function to check if the current build contains a banned perk from a specified override.
 * @param {object} build The build to check for banned perks.
 * @param {object} override The override to check for banned perks in.
 * @returns {object} An object containing the error information if an error is found.
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
        // DebugLog(override.SurvivorIndvPerkBans);
        for (var j = 0; j < override.SurvivorIndvPerkBans.length; j++) {
            var currentBannedPerk = parseInt(override.SurvivorIndvPerkBans[j]);

            if (currentBannedPerk == undefined) { continue; }

            // DebugLog(`Checking if ${currentPerk["name"]} is banned against ${override.Name}...`);
            if (currentPerk["id"] == currentBannedPerk) {
                ErrorList.push(
                    GenerateErrorObject(
                        "Banned Perk",
                        `Perk <b>${currentPerk["name"]}</b> is banned against <b>${override.Name}</b>. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                        console.trace(),
                        "iconography/Error.png"
                    )
                )
            }
        }

        // Check if current perk is whitelisted
        var perkWhitelisted = false;

        // DebugLog(`Checking if ${currentPerk["name"]} is whitelisted explicitly against ${override.Name}...`);
        for (var j = 0; j < override.SurvivorWhitelistedPerks.length; j++) {
            var currentWhitelistedPerk = parseInt(override.SurvivorWhitelistedPerks[j]);

            if (currentPerk == undefined) { continue; }

            // DebugLog(`Checking if ${currentPerk["name"]} is whitelisted against ${override.Name}...`)
            if (currentPerk["id"] == currentWhitelistedPerk) {
                perkWhitelisted = true;
                // DebugLog(`Perk ${currentPerk["name"]} is whitelisted against ${override.Name}!`);
            }
        }

        // Check if banned by tier

        // DebugLog(`Checking if ${currentPerk["name"]} is banned by a tier in ${override.Name}...`);
        // DebugLog(override.SurvivorBalanceTiers);
        for (var j = 0; j < override.SurvivorBalanceTiers.length; j++) {
            // DebugLog(`Current Balance Tier: ${currentBalancing.Tiers[j].Name}`);
            if (perkWhitelisted) { break; }

            var currentTierIndex = override.SurvivorBalanceTiers[j];
            var currentTier = currentBalancing.Tiers[currentTierIndex];

            // DebugLog(`Checking if ${currentPerk["name"]} is banned in ${currentTier.Name} Tier Balancing...`);

            if (currentTier == undefined) { continue; }

            // Check if current perk is banned
            for (var k = 0; k < currentTier.SurvivorIndvPerkBans.length; k++) {
                var currentBannedPerk = parseInt(currentTier.SurvivorIndvPerkBans[k]);

                if (currentPerk == undefined) { continue; }
                if (currentBannedPerk == undefined) { continue; }

                //DebugLog(`Checking if ${currentPerk["name"]} is banned in ${currentTier.Name} Tier Balancing...`);
                if (currentPerk["id"] == currentBannedPerk) {
                    ErrorList.push(
                        GenerateErrorObject(
                            "Banned Perk",
                            `Perk <b>${currentPerk["name"]}</b> is banned in <b>${currentTier.Name}</b> Tier Balancing. It is present in <b>Survivor #${survivorIndex+1}</b>'s build.`,
                            console.trace(),
                            "iconography/Error.png"
                        )
                    )
                }
            }

        }
    }

    return ErrorList;
}

function CheckForBalancingErrors() {
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

    UpdateErrorUI();
}

function UpdateErrorUI() {
    var errorListContainer = document.getElementById("error-list-container");
    errorListContainer.innerHTML = "";

    for (var i = 0; i < MasterErrorList.length; i++) {
        let currentError = MasterErrorList[i];

        let errorContainer = document.createElement("div");
        errorContainer.classList.add("error-list-item");

        let errorHeaderContainer = document.createElement("div");
        errorHeaderContainer.classList.add("error-header-container");

        let errorIcon = document.createElement("img");
        errorIcon.src = currentError["ICON"];
        errorIcon.classList.add("error-icon");

        let errorTitle = document.createElement("h1");
        errorTitle.classList.add("error-title");
        errorTitle.innerText = currentError["ERROR"];

        let errorDescription = document.createElement("p");
        errorDescription.innerHTML = currentError["REASON"];

        errorHeaderContainer.appendChild(errorIcon);
        errorHeaderContainer.appendChild(errorTitle);

        errorContainer.appendChild(errorHeaderContainer);
        errorContainer.appendChild(errorDescription);

        errorListContainer.appendChild(errorContainer);
    }

    var errorPanelTitle = document.getElementById("error-panel-title");

    errorPanelTitle.innerText = MasterErrorList.length > 0 ? `Errors (${MasterErrorList.length})` : "No Errors";
}

/* -------------------------------------- */
/* ------------- UTILITIES -------------- */
/* -------------------------------------- */

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
 * @param {string} name 
 * @param {string} reason 
 * @param {string} stacktrace 
 * @param {string} icon 
 * @returns 
 */
function GenerateErrorObject(
    name = "Default Error",
    reason = "Default Reason",
    stacktrace = console.trace(),
    icon = "iconography/Error.png") {
        return {
            ERROR: name,
            REASON: reason,
            STACKTRACE: stacktrace,
            ICON: icon
        };
    }

function GenerateAlertModal(
    title,
    message
) {
    var alertContainer = document.getElementById("alert-container");
    alertContainer.hidden = false;

    var alertTitle = document.getElementById("alert-title");
    alertTitle.innerText = title;

    var alertMessage = document.getElementById("alert-message");
    alertMessage.innerHTML = message;

    var alertOkButton = document.getElementById("alert-ok-button");
    alertOkButton.addEventListener("click", function() {
        alertContainer.hidden = true;
    });
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

/**
 * A function to create a status object for the app.
 * @returns {object} An object containing the current status of the app. Is used for multiplayer builds.
 */
function CreateStatusObject() {
    var buildStatus = {
        "SurvivorPerks": SurvivorPerks,
        "selectedKiller": selectedKiller,
        "currentBalancingIndex": currentBalancingIndex,
        "customBalanceOverride": customBalanceOverride,
        "currentBalancing": currentBalancing,
        "roomID": RoomID
    }

    return buildStatus;
}

/* -------------------------------------- */
/* -------------- SOCKET ---------------- */
/* -------------------------------------- */

// Socket Events

function SendRoomDataUpdate() {
    DebugLog("Multiplayer not enabled!");
}

function JoinRoom(roomID) {
    DebugLog("Multiplayer not enabled!");
}

function CreateSocketEvents() {
    if (!Config.multiplayerEnabled) { return; }

    SendRoomDataUpdate = function() {
        DebugLog("Sending room update to server!");
        socket.emit('clientRoomDataUpdate', CreateStatusObject());
    }

    JoinRoom = function(roomID) {
        DebugLog(`Joining room ${roomID}...`);
        socket.emit('clientJoinRoom', roomID);
    }

    socket.on("connect", function() {
        DebugLog("Connected to server!");
    });
    
    socket.on('serverRequestRoomData', function() {
        DebugLog("Room data requested!");
        socket.emit('clientRoomDataResponse', CreateStatusObject());
    });
    
    socket.on('serverRoomDataResponse', function(data) {
        DebugLog("Room Data Received from server!");
        DebugLog(data);
    
        // Update local data
        DebugLog("Updating local data...");
        let appStatus = data.appStatus;
    
        SurvivorPerks = appStatus.builds;
        selectedKiller = appStatus.selectedKiller;
        currentBalancingIndex = appStatus.currentBalancingIndex;
        customBalanceOverride = appStatus.customBalanceOverride;
        currentBalancing = appStatus.currentBalancing;
        RoomID = appStatus.roomID;
    
        // Update UI
        UpdateBalancingDropdown();
        UpdateKillerSelectionUI();
        UpdatePerkUI();
        CheckForBalancingErrors();
    });
    
    socket.on('roomID', function(id) {
        RoomID = id;
        DebugLog(`Room ID: ${RoomID}`);
    });
}