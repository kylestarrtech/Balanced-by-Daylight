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
    },
    {
        Name: "Champions of the Fog (COTF)",
        Path: "BalancingPresets/COTF.json",
        Balancing: {}
    }
]

var currentBalancingIndex = 0;
var customBalanceOverride = false;
var onlyShowNonBanned = false;
var saveLoadoutsAndKiller = false;

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

// Load settings from local storage.

//if(localStorage.getItem("selectedKiller")) selectedKiller = parseInt(localStorage.getItem("selectedKiller"));
if(localStorage.getItem("currentBalancingIndex")) currentBalancingIndex = parseInt(localStorage.getItem("currentBalancingIndex"));
if(localStorage.getItem("onlyShowNonBanned")) onlyShowNonBanned = localStorage.getItem("onlyShowNonBanned") == "true";
if(localStorage.getItem("saveLoadoutsAndKiller")) saveLoadoutsAndKiller = localStorage.getItem("saveLoadoutsAndKiller") == "true";

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

    // Loads survivor perks from local storage if enabled
    if (Config.saveBuilds) {
        document.getElementById("save-loadouts-killer-container").style.display = "block";

        if(saveLoadoutsAndKiller){
            if(localStorage.getItem("selectedKiller")) selectedKiller = parseInt(localStorage.getItem("selectedKiller"));
            if(localStorage.getItem("SurvivorPerks")) SurvivorPerks = JSON.parse(localStorage.getItem("SurvivorPerks"));
        }
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

    // Sets balancing to either local storage or default, in this case we're doing local storage since it's default balancing.
    currentBalancingIndex = 0;
    if(localStorage.getItem("currentBalancingIndex")) currentBalancingIndex = parseInt(localStorage.getItem("currentBalancingIndex"));

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
            }
        }
    }

    // Load default balancing if custom balancing is not enabled/not saved.
    if (loadDefaultBalance) {
            // Set balancing to said index.
        currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];
    }




    // Update the checkbox to show non-banned perks in the search
    document.getElementById("only-non-banned").checked = onlyShowNonBanned;

    // Update the checkbox to save loadouts and killer selected
    document.getElementById("save-loadouts-killer").checked = saveLoadoutsAndKiller;

    // Update the custom balance checkbox to show if custom balancing is enabled
    document.getElementById("custom-balancing-checkbox").checked = customBalanceOverride;

    // Update the custom balance text area to show the current custom balancing
    if (customBalanceOverride) {
        document.getElementById("custom-balance-select").value = JSON.stringify(currentBalancing, null, 4);
        
        // Hide the balancing select dropdown
        document.getElementById("balancing-select").hidden = true;
        document.getElementById("balance-mode-label").hidden = true;

        // Show the custom balancing text area
        document.getElementById("custom-balance-select").hidden = false;
    }

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
let dragTargetElement = {}
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

            perkElement.addEventListener("dragstart", function(event){
                event.dataTransfer.effectAllowed = "move"
                dragTargetElement = {}
                dragTargetElement.draggable = 0
                event.dataTransfer.sourceSurv = event.target.parentElement.getAttribute("data-survivor-i-d")
                event.dataTransfer.sourcePerk = event.target.parentElement.getAttribute("data-perk-i-d")
                event.dataTransfer.sourcePerkId = GetPerkIdByFileName(event.target.getAttribute("src"))
            });
            perkElement.addEventListener("dragover", function(event){
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
            });
            perkElement.addEventListener("dragenter", function(event){
                event.preventDefault()
                dragTargetElement.targetSurv = event.target.parentElement.getAttribute("data-survivor-i-d")
                dragTargetElement.targetPerk = event.target.parentElement.getAttribute("data-perk-i-d")
                dragTargetElement.targetPerkId = GetPerkIdByFileName(event.target.getAttribute("src"))
                dragTargetElement.draggable++
            });
            perkElement.addEventListener("dragleave", function(event){
                event.preventDefault()
                dragTargetElement.draggable--
            });
            perkElement.addEventListener("dragend", function(event){
                event.preventDefault()

                const sourceSurv = parseInt(event.dataTransfer.sourceSurv)
                const sourcePerk = parseInt(event.dataTransfer.sourcePerk) 

                if(dragTargetElement.draggable <= 0){
                    SurvivorPerks[sourceSurv][sourcePerk] = null
                }else{
                    const targetSurv = parseInt(dragTargetElement.targetSurv)
                    const targetPerk = parseInt(dragTargetElement.targetPerk) 
                    
                    SurvivorPerks[sourceSurv][sourcePerk] = dragTargetElement.targetPerkId ? GetPerkById(dragTargetElement.targetPerkId) : null
                    SurvivorPerks[targetSurv][targetPerk] = event.dataTransfer.sourcePerkId ? GetPerkById(event.dataTransfer.sourcePerkId) : null
                }

                if (Config.saveBuilds && saveLoadoutsAndKiller) {
                    localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
                }
                UpdatePerkUI()
                CheckForBalancingErrors()
            });

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
    
    // Remove all character-selected classes
    if(document.querySelector(`.character-selected`)) {
        document.querySelector(`.character-selected`).classList.remove("character-selected")
    }
    
    // Add character-selected class to selected killer
    document.querySelector(`[data-killerid="${selectedKiller}"]`).classList.add("character-selected")
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
    balancingDropdown.value = currentBalancingIndex;

    balancingDropdown.addEventListener("change", function() {
        currentBalancingIndex = parseInt(balancingDropdown.value);
        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

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
        localStorage.setItem("customBalanceOverride", customBalanceOverride);

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

    LoadImportEvents();

    LoadPerkSearchEvents();

    LoadRoomEvents();
}

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
                currentBalancing = BalancePresets[importDataObj.currentBalancingIndex]["Balancing"];
            }

            // Check if importData.survivorPerksId is a valid array
            if (importDataObj.survivorPerksId == undefined) {
                throw "Invalid import data. SurvivorPerks is undefined.";
            }
            if (importDataObj.survivorPerksId.length != 4) {
                throw "Invalid import data. SurvivorPerks length is not 4.";
            }

            let survCpt = 0
            let perkCpt = 0
            for(const currentSurvivor of importDataObj.survivorPerksId){
                if (currentSurvivor.length != 4) {
                    throw "Invalid import data. SurvivorPerks length is not 4.";
                }
                
                for(const currentPerkId of currentSurvivor){
                    if (currentPerkId == undefined) {
                        throw "Invalid import data. Perk ID is undefined.";
                    }

                    SurvivorPerks[survCpt][perkCpt] = GetPerkById(currentPerkId)

                    perkCpt++
                }
                perkCpt = 0
                survCpt++
            }

            // If all checks pass, set the remaining data
            currentBalancingIndex = importDataObj.currentBalancingIndex;
            selectedKiller = importDataObj.selectedKiller;
            customBalanceOverride = importDataObj.customBalanceOverride;

            if (Config.saveBuilds && saveLoadoutsAndKiller) {
                localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
                localStorage.setItem("selectedKiller", selectedKiller);
            }
            localStorage.setItem("currentBalancingIndex", currentBalancingIndex);
            localStorage.setItem("customBalanceOverride", customBalanceOverride);

            // Update UI
            UpdatePerkUI();
            UpdateBalancingDropdown();
            CheckForBalancingErrors();
            UpdateKillerSelectionUI();
        } catch (error) {
            GenerateAlertModal("Error", `An error occurred while importing your builds. Please ensure that the data is in the correct format.\n\nError: ${error}`);
        }
    });

    exportButton.addEventListener("click", function() {
        const survivorPerksId = new Array()
        for(const surv of SurvivorPerks){
            const perksId = new Array()
            for(const perk of surv){
                perksId.push(perk.id)
            }
            survivorPerksId.push(perksId)
        }

        const exportJson = {
            "survivorPerksId": survivorPerksId,
            "selectedKiller": selectedKiller,
            "currentBalancingIndex": currentBalancingIndex,
            "customBalanceOverride": customBalanceOverride,
            "onlyShowNonBanned": onlyShowNonBanned,
            "currentBalancing": customBalanceOverride ? currentBalancing : null,
            "roomID": RoomID
        }
        const exportData = JSON.stringify(exportJson);

        const deflate = pako.deflate(exportData, { to: "string" });
        const compressedText = btoa(String.fromCharCode.apply(null, deflate));

        // Ask user if they'd like to copy to clipboard. If yes, copy to clipboard. If no, return.
        // if (!confirm("Would you like to copy your build data to your clipboard?")) {
        //     return;
        // }

        // Copy exportData to clipboard
        navigator.clipboard.writeText(compressedText);

        GenerateAlertModal("Export Successful", "Your builds data has been copied to your clipboard!");
    });
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
            localStorage.setItem("selectedKiller", selectedKiller);

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

            // Save custom balancing to local storage
            localStorage.setItem("currentBalancing", JSON.stringify(currentBalancing));

            //currentBalancingIndex = -1;
        } else {
            currentBalancingIndex = parseInt(document.getElementById("balancing-select").value);
            currentBalancing = BalancePresets[currentBalancingIndex]["Balancing"];
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

        CheckForBalancingErrors();
        SendRoomDataUpdate();
    });

    const onlyNonBannedCheckbox = document.getElementById("only-non-banned");
    onlyNonBannedCheckbox.addEventListener("change", function(){
        onlyShowNonBanned = onlyNonBannedCheckbox.checked;
        localStorage.setItem("onlyShowNonBanned", onlyShowNonBanned);
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

    perkSearchContainer.addEventListener("click", function(event) {
        if(event.target.tagName === "IMG" || event.target.classList.contains("background-blur"))
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
        if (Config.saveBuilds && saveLoadoutsAndKiller) {
            localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
        }
    });

    blankPerk.addEventListener("mouseover", function() {
        var perkTooltip = document.getElementById("perk-highlight-name");

        perkTooltip.innerText = "Blank Perk";
    });

    const bannedPerks = GetBannedPerks()    
    for (var i = 0; i < searchResults.length; i++) {
        let currentPerk = searchResults[i];

        let isBanned = false;
        let isEquipped = false;

        let perkElement = document.createElement("div");
        perkElement.classList.add("perk-slot-result");
        
        // Check if the perk is banned.
        if(bannedPerks.includes(currentPerk["id"] + "")){
            //perkElement.classList.add("perk-slot-result-banned");
            isBanned = true;
        }

        // Check if the perk is already equipped.
        let equipCount = 0;
        for(const surv of SurvivorPerks){
            for(const perk of surv){
                if(perk && perk.id == currentPerk["id"]){
                    //perkElement.classList.add("perk-slot-result-equipped");
                    equipCount++;
                }
            }
        }

        // If the perk is equipped more than the max amount, it's equipped fully.
        if (equipCount >= currentBalancing.MaxPerkRepetition) {
            isEquipped = true;
        }

        // Add classes based on perk status
        if (isBanned) {
            if (isEquipped) {
                perkElement.classList.add("perk-slot-result-banned-and-equipped");
            } else {
                perkElement.classList.add("perk-slot-result-banned");
            }
        } else if (isEquipped) {
            perkElement.classList.add("perk-slot-result-equipped");
        }

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
            if (Config.saveBuilds && saveLoadoutsAndKiller) {
                localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
            }
        });

        perkElement.addEventListener("mouseover", function() {
            var perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerHTML = currentPerk["name"];

            if (isBanned) {
                if (!isEquipped) {
                    perkTooltip.innerHTML += " <span style='color: #ff8080'>(Banned)</span>";
                } else {
                    perkTooltip.innerHTML += " <span style='color: #ffbd80'>(Equipped + Banned)</span>";
                }
            } else {
                if (isEquipped) {
                    perkTooltip.innerHTML += " <span style='color: #80ff80'>(Equipped)</span>";
                }
            }
        });
    }
}

// Button Events
function SearchForPerks(searchQuery, isSurvivor) {
    var searchResults = [];

    let bannedPerks = new Array()
    if(onlyShowNonBanned){
        bannedPerks = GetBannedPerks()
    }

    for (var i = 0; i < Perks.length; i++) {
        if(Perks[i].name.toLowerCase().includes(searchQuery.toLowerCase())) {
            if((onlyShowNonBanned && bannedPerks.includes(Perks[i].id + ""))) continue
            if(Perks[i].survivorPerk == isSurvivor){
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

function GetBannedPerks(){
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

    return bannedPerks
}

function GetPerkIdByFileName(fileName){
    for(const perk of Perks){
        if(perk.icon == fileName) return perk.id
    }
}

function GetPerkById(id){
    for(const perk of Perks){
        if(perk.id == id) return perk
    }
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
        localStorage.setItem("customBalanceOverride", customBalanceOverride);
        
        currentBalancingIndex = 0;
        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);

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

    let ErrorElementList = [];
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

        ErrorElementList.push(errorContainer);
    }

    let survCpt = 0
    let perkCpt = 0
    if(document.querySelector(".perk-slot-result-banned")){
        document.querySelectorAll(".perk-slot-result-banned").forEach(perkSlot => perkSlot.classList.remove("perk-slot-result-banned"))
    }
    for(const surv of SurvivorPerks){
        for(const perk of surv){
            const survPerk = document.querySelector(`[data-survivor-i-d="${survCpt}"][data-perk-i-d="${perkCpt}"]`)

            for(const error of MasterErrorList){
                if(survPerk && survPerk.classList && perk && error.REASON.includes(perk.name)){
                    survPerk.classList.add("perk-slot-result-banned")
                    break
                }
            }

            perkCpt++
        }
        perkCpt = 0
        survCpt++
    }

    // Go through error list and add to container with a delay of 100ms in between each error.
    let totalTime = 0;
    for (var i = 0; i < ErrorElementList.length; i++) {
        let currentError = ErrorElementList[i];

        let timerMS = 150 * i;

        totalTime += 150;
        if (totalTime > 5000) {
            timerMS = 0;
        }

        setTimeout(function() {
            errorListContainer.appendChild(currentError);
        }, timerMS);
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
        "onlyShowNonBanned": onlyShowNonBanned,
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
        onlyShowNonBanned = appStatus.onlyShowNonBanned;
        currentBalancing = appStatus.currentBalancing;
        RoomID = appStatus.roomID;

        if (Config.saveBuilds && saveLoadoutsAndKiller) {
            localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
            localStorage.setItem("selectedKiller", selectedKiller);
        }

        localStorage.setItem("currentBalancingIndex", currentBalancingIndex);
        localStorage.setItem("customBalanceOverride", customBalanceOverride);
        localStorage.setItem("onlyShowNonBanned", onlyShowNonBanned);
    
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