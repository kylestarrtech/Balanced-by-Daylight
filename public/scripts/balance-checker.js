var debugging = true;

var Perks = null;
var Killers = null;
var Survivors = null;
var Maps = null;
var Addons = null;
var Offerings = null;

var AllDataLoaded = false;

var BalancePresets = [
    {
        Name: "Outrun the Fog (OTF)",
        Path: "BalancingPresets/OTF.json",
        Balancing: {}
    },
    {
        Name: "Custom",
        Path: "",
        Balancing: {}
    }
]
var currentBalancingIndex = 0;

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
customBalanceObj = undefined; // To be used if currentBalancingIndex = -1

function main() {
    document.body.addEventListener("mousemove", UpdateMousePos);

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
    currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];

    CheckForBalancingErrors();
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

            DebugLog(`${j}/${i} - Current Perk: ${currentPerk}`);

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

    let optionElement = document.createElement("option");
    optionElement.innerText = "Custom";
    optionElement.value = -1;

    balancingDropdown.appendChild(optionElement);

    balancingDropdown.value = 0;

    balancingDropdown.addEventListener("change", function() {
        currentBalancingIndex = parseInt(balancingDropdown.value);

        var customBalancingContainer = document.getElementById("custom-balance-select");
        if (currentBalancingIndex == -1) {
            // Show custom balancing
            customBalancingContainer.hidden = false;
        } else {
            // Hide custom balancing
            customBalancingContainer.hidden = true;
        }

        currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];
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
}

function SetKillerCharacterSelectEvents() {
    var GetCharacterSelectButtons = document.getElementsByClassName("character-select-button");

    for (var i = 0; i < GetCharacterSelectButtons.length; i++) {

        let newIndex = i;
        let currentButton = GetCharacterSelectButtons[newIndex];
        currentButton.addEventListener("click", function() {
            DebugLog(newIndex);
            selectedKiller = newIndex;

            UpdateKillerSelectionUI();
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
    for (var i = 0; i < BalancePresets.length-1; i++) {
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

    var customBalanceObj = {};
    try {
        customBalanceObj = JSON.parse(customBalanceInput.value);
    } catch (error) {
        //alert("Invalid JSON for custom balancing. Using default balancing.");
        currentBalancingIndex = 0;
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

    DebugLog(builds);

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
                    ErrorLog.push({
                        ERROR: "Perk Repetition",
                        REASON: `Perk ${currentPerk["name"]} is repeated ${perkRepeatAmount} times in the Survivor builds.`
                    });
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

    DebugLog(build);

    for (var i = 0; i < build.length; i++) {
        let currentPerk = build[i];

        if (currentPerk == undefined) { continue; }

        for (var j = i+1; j < build.length; j++) {
            let otherPerk = build[j];

            if (otherPerk == undefined) { continue; }

            DebugLog(`Comparing ${currentPerk["name"]} to ${otherPerk["name"]}`);
            if (currentPerk["id"] == otherPerk["id"]) {
                ErrorLog.push({
                    ERROR: "Duplicate Perk",
                    REASON: `Perk ${currentPerk["name"]} is duplicated in Survivor #${survIndex}'s build.`,
                });
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
 */
function CheckForBannedIndividualPerk(build) {
}

/**
 * A function to check if the current build contains a banned perk combination.
 * @param {object} build The build to check for banned perk combinations.
 */
function CheckForBannedComboPerks(build) {
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
    CheckForBannedIndividualPerk(SurvivorPerks);

    // Check for banned perk combinations
    CheckForBannedComboPerks(SurvivorPerks);

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
        errorIcon.src = "iconography/Error.png";
        errorIcon.classList.add("error-icon");

        let errorTitle = document.createElement("h1");
        errorTitle.classList.add("error-title");
        errorTitle.innerText = currentError["ERROR"];

        let errorDescription = document.createElement("p");
        errorDescription.innerText = currentError["REASON"];

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

    if (!printStackTrace) { return; }
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