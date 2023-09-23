debugging = true;

Perks = null;
Killers = null;
Survivors = null;
Maps = null;
Addons = null;
Offerings = null;

AllDataLoaded = false;

BalancePresets = [
    {
        Name: "Outrun the Fog (OTF)",
        Path: "BalancingPresets/OTF.json",
        Balancing: {}
    },
    {
        Name: "DBDLeague (DBDL)",
        Path: "BalancingPresets/DBDL.json",
        Balancing: {}
    }
]

mousePos = [0, 0];
function UpdateMousePos(event) {
    mousePos = [event.clientX, event.clientY];
}

SurvivorPerks = [
    [
        undefined, // Perk 1
        undefined, // Perk 2
        undefined, // Perk 3
        undefined  // Perk 4
    ],
    [
        undefined, // Perk 1
        undefined, // Perk 2
        undefined, // Perk 3
        undefined  // Perk 4
    ],
    [
        undefined, // Perk 1
        undefined, // Perk 2
        undefined, // Perk 3
        undefined  // Perk 4
    ],
    [
        undefined, // Perk 1
        undefined, // Perk 2
        undefined, // Perk 3
        undefined  // Perk 4
    ]
]

selectedKiller = 0;
currentBalancingIndex = 0;
customBalanceObj = undefined; // To be used if currentBalancingIndex = 2

function main() {
    document.body.addEventListener("mousemove", UpdateMousePos);

    // Load data
    GetPerks();

    // Update Perk Page
    UpdatePerkUI();

    // Load button events
    LoadButtonEvents();
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

/**
 * A function to load all button events.
 * Nested with other functions to keep things clean.
 */
function LoadButtonEvents() {

    LoadSettingsEvents();

    LoadPerkSelectionEvents();

    LoadPerkSearchEvents();
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
            AllDataLoaded = true;
        }
    }
    xhttp.open("GET", "Offerings.json", false);
    xhttp.send();
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