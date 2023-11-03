var debugging = false;
var overrideStackTrace = false;

var Perks = null;
var Killers = null;
var Survivors = null;
var Maps = null;
var Addons = null;
var Offerings = null;
var Items = null;

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
    },
    {
        Name: "Davy Jones League",
        Path: "BalancingPresets/DavyJones.json",
        Balancing: {}
    },
    {
        Name: "L-Tournament",
        Path: "BalancingPresets/L-Tournament.json",
        Balancing: {}
    }
]

var currentBalancingIndex = 0;
var customBalanceOverride = false;
var onlyShowNonBanned = false;
var saveLoadoutsAndKiller = false;

var currentBalancing = null;

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

SurvivorOfferings = [
    null,
    null,
    null,
    null
]

SurvivorItems = [
    undefined,
    undefined,
    undefined,
    undefined
]

SurvivorAddons = [
    [undefined, undefined],
    [undefined, undefined],
    [undefined, undefined],
    [undefined, undefined]
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
            if(localStorage.getItem("SurvivorOfferings")) SurvivorOfferings = JSON.parse(localStorage.getItem("SurvivorOfferings"));
            if(localStorage.getItem("SurvivorItems")) SurvivorItems = JSON.parse(localStorage.getItem("SurvivorItems"));
            if(localStorage.getItem("SurvivorAddons")) SurvivorAddons = JSON.parse(localStorage.getItem("SurvivorAddons"));

            ScrollToSelectedKiller();
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
                loadDefaultBalance = false;
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

function DisplayCredits() {
    GenerateAlertModal(
        "Credits/Contributors",
        "Many people have made great contributions to Balanced by Daylight. This is one way to spotlight them.<br><br>-<br>" +
        "<b>SHADERS (Kyle)</b> - Started the project, and leads the development of Balanced by Daylight.<br>-<br>" +
        "<b>Floliroy</b> - Assisted heavily in improvements to Perk search, import/export, added drag/drop, and SO much more...<br>-<br>" +
        "<b>S1mmyy</b> - Fixed the drag/drop functionality on Firefox and made the system much easier to work with.<br>-<br>" +
        "<b>Vivian Sanchez</b> - Began the work on the mobile UI for Balanced by Daylight.<br>-<br>" +
        "<b>WheatDraws</b> - Created the Balanced by Daylight logo.<br>-<br>" +
        "<br>" + 
        "This project is open source, and contributions are welcome. If you would like to contribute, please visit the <a target='_blank' href='https://github.com/kylestarrtech/DBD-Balance-Checker'>GitHub</a>."
    );
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
let dragTargetElement, dragSourceElement = {}
function UpdatePerkUI() {
    // Get the builds container
    var buildsContainer = document.getElementById("survivor-builds-container");

    // Get all children
    var children = buildsContainer.children;

    //-20 for the 10px padding on left & right
    const maxWidth = children[0].offsetWidth - 20;

    // Loop through all children
    validChildI = 0;
    for (var i = 0; i < children.length; i++) {
        let currentChild = children[i];
        // Is this a valid build component?
        if (!currentChild.classList.contains("survivor-build-component")) { continue; }
        
        currentChild.style.maxWidth = maxWidth + "px";
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
                ImgSrc = "public/Perks/blank.webp";
            }
            
            let perkElement = document.createElement("div");
            perkElement.classList.add("perk-slot");
            perkElement.classList.add("loadout-slot");

            perkElement.addEventListener("dragstart", function(event) {
                event.dataTransfer.effectAllowed = "move"
                dragSourceElement, dragTargetElement = {}
                dragTargetElement.draggable = 0

                dragSourceElement.sourceSurv = event.target.parentElement.dataset.survivorID
                dragSourceElement.sourcePerkSlot = event.target.parentElement.dataset.perkID
                dragSourceElement.sourcePerkId = GetPerkIdByFileName(event.target.getAttribute("src"))
            });
            perkElement.addEventListener("dragover", function(event) {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
            });
            perkElement.addEventListener("dragenter", function(event) {
                event.preventDefault()
                dragTargetElement.targetSurv = event.target.parentElement.dataset.survivorID
                dragTargetElement.targetPerkSlot = event.target.parentElement.dataset.perkID
                dragTargetElement.targetPerkId = GetPerkIdByFileName(event.target.getAttribute("src"))
                dragTargetElement.draggable++
            });
            perkElement.addEventListener("dragleave", function(event) {
                event.preventDefault()
                dragTargetElement.draggable--
            });
            perkElement.addEventListener("dragend", function(event) {
                event.preventDefault()

                let sourceSurv = parseInt(dragSourceElement.sourceSurv)
                let sourcePerkSlot = parseInt(dragSourceElement.sourcePerkSlot)
                let sourcePerkId = dragSourceElement.sourcePerkId

                if(dragTargetElement.draggable <= 0) { // If we're not dragging over a valid element, remove the perk
                    SurvivorPerks[sourceSurv][sourcePerkSlot] = null
                }
                else {
                    
                    let newSourcePerk = null;
                    if (dragTargetElement.targetPerkId != null) {
                        newSourcePerk = GetPerkById(dragTargetElement.targetPerkId)
                    }
                    SurvivorPerks[sourceSurv][sourcePerkSlot] = newSourcePerk

                    let targetSurv = parseInt(dragTargetElement.targetSurv)
                    let targetPerkSlot = parseInt(dragTargetElement.targetPerkSlot)
                    
                    let newTargetPerk = null
                    if (sourcePerkId != null) {
                        newTargetPerk = GetPerkById(sourcePerkId)
                    }
                    SurvivorPerks[targetSurv][targetPerkSlot] = newTargetPerk
                }

                if (Config.saveBuilds && saveLoadoutsAndKiller) {
                    localStorage.setItem("SurvivorPerks", JSON.stringify(SurvivorPerks));
                }
                UpdatePerkUI()
                CheckForBalancingErrors()

                event.dataTransfer.clearData();
            });

            perkElement.dataset.survivorID = validChildI;
            perkElement.dataset.perkID = j;

            let perkImg = document.createElement("img");
            perkImg.src = ImgSrc;
        
            perkElement.appendChild(perkImg);
            currentChild.appendChild(perkElement);
        }

        // Get current survivor offerings
        let currentSurvivorOffering = SurvivorOfferings[validChildI];

        // Create offering element
        let offeringElement = document.createElement("div");
        offeringElement.classList.add("offering-slot");
        offeringElement.classList.add("loadout-slot");
        
        let OffSrc = "";
        try {
            OffSrc = currentSurvivorOffering["icon"];    
        } catch (error) {
            OffSrc = "public/Offerings/blank.webp";
        }
        
        offeringElement.addEventListener("dragstart", function(event){
            event.dataTransfer.effectAllowed = "move"
            dragSourceElement, dragTargetElement = {}
            dragTargetElement.draggable = 0

            dragSourceElement.sourceSurv = event.target.parentElement.getAttribute("data-survivor-i-d")
            dragSourceElement.sourceOfferingID = GetOfferingIdByFileName(event.target.getAttribute("src"))
        });
        offeringElement.addEventListener("dragover", function(event){
            event.preventDefault()
            event.dataTransfer.dropEffect = "move"
        });
        offeringElement.addEventListener("dragenter", function(event){
            event.preventDefault()

            // Set the target survivor ID (where we're dragging to)
            dragTargetElement.targetSurv = event.target.parentElement.getAttribute("data-survivor-i-d")
            
            // Set the target offering ID (where we're dragging to)
            dragTargetElement.targetOfferingID = GetOfferingIdByFileName(event.target.getAttribute("src"))
            
            // Increment the draggable counter, this is used to check if we're dragging over a valid element
            dragTargetElement.draggable++
        });
        offeringElement.addEventListener("dragleave", function(event){
            event.preventDefault()

            // Decrement the draggable counter, this is used to check if we're dragging over a valid element
            dragTargetElement.draggable--
        });
        offeringElement.addEventListener("dragend", function(event){
            event.preventDefault()

            // Get the source survivor ID (where we're dragging from)
            const sourceSurv = parseInt(dragSourceElement.sourceSurv);

            // Get the source offering ID (where we're dragging from)
            const sourceOfferingID = parseInt(dragSourceElement.sourceOfferingID);

            if(dragTargetElement.draggable <= 0){ // If we're not dragging over a valid element, remove the offering
                SurvivorOfferings[sourceSurv] = null
            }else{ // If we are dragging over a valid element, swap the offerings

                let newSourceOffering = null;

                if (dragTargetElement.targetOfferingID != null) { // If the target offering ID is not null, get the offering by ID
                    newSourceOffering = GetOfferingById(dragTargetElement.targetOfferingID)
                }
                const targetSurv = parseInt(dragTargetElement.targetSurv)

                let newTargetOffering = null;

                if (sourceOfferingID != null) { // If the source offering ID is not null, get the offering by ID
                    newTargetOffering = GetOfferingById(sourceOfferingID)
                }
                
                SurvivorOfferings[sourceSurv] = newSourceOffering;
                SurvivorOfferings[targetSurv] = newTargetOffering;
            }

            if (Config.saveBuilds) {
                localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
            }
            UpdatePerkUI();
            CheckForBalancingErrors();
        });
        
        offeringElement.dataset.survivorID = validChildI;

        let offeringImg = document.createElement("img");
        offeringImg.src = OffSrc;

        offeringElement.appendChild(offeringImg);
        currentChild.appendChild(offeringElement);

        // Get current survivor item
        let currentSurvivorItem = SurvivorItems[validChildI];

        // Create item element
        let itemElement = document.createElement("div");
        itemElement.classList.add("item-slot");
        itemElement.classList.add("loadout-slot");

        let itemSrc = "";
        try {
            itemSrc = currentSurvivorItem["icon"];
        } catch (error) {
            itemSrc = "public/Items/blank.webp";
        }

        itemElement.addEventListener("dragstart", function(event){
            event.dataTransfer.effectAllowed = "move"
            dragSourceElement, dragTargetElement = {}
            dragTargetElement.draggable = 0

            dragSourceElement.sourceSurv = event.target.parentElement.getAttribute("data-survivor-i-d")
            dragSourceElement.sourceItemID = GetItemIdByFileName(event.target.getAttribute("src"))
            dragSourceElement.sourceItemAddons = SurvivorAddons[dragSourceElement.sourceSurv];
        });
        itemElement.addEventListener("dragover", function(event){
            event.preventDefault()
            event.dataTransfer.dropEffect = "move"
        });
        itemElement.addEventListener("dragenter", function(event){
            event.preventDefault()

            // Set the target survivor ID (where we're dragging to)
            dragTargetElement.targetSurv = event.target.parentElement.getAttribute("data-survivor-i-d")
            
            // Set the target item ID (where we're dragging to)
            dragTargetElement.targetItemID = GetItemIdByFileName(event.target.getAttribute("src"))
            
            // Set the target item addons (where we're dragging to)
            dragTargetElement.targetItemAddons = SurvivorAddons[dragTargetElement.targetSurv];

            // Increment the draggable counter, this is used to check if we're dragging over a valid element
            dragTargetElement.draggable++
        });
        itemElement.addEventListener("dragleave", function(event){
            event.preventDefault()

            // Decrement the draggable counter, this is used to check if we're dragging over a valid element
            dragTargetElement.draggable--
        });
        itemElement.addEventListener("dragend", function(event){
            event.preventDefault()

            // Get the source survivor ID (where we're dragging from)
            const sourceSurv = parseInt(dragSourceElement.sourceSurv);

            // Get the source item ID (where we're dragging from)
            const sourceItemID = parseInt(dragSourceElement.sourceItemID);

            // Get the source item addons (where we're dragging from)
            const sourceItemAddons = dragSourceElement.sourceItemAddons;

            if(dragTargetElement.draggable <= 0){ // If we're not dragging over a valid element, remove the item
                SurvivorItems[sourceSurv] = null;
                SurvivorAddons[sourceSurv] = [undefined, undefined];
            }else{ // If we are dragging over a valid element, swap the items

                let newSourceItem = null;
                let newSourceAddons = null;

                if (dragTargetElement.targetItemID != null) { // If the target item ID is not null, get the item by ID
                    newSourceItem = GetItemById(dragTargetElement.targetItemID)
                }
                const targetSurv = parseInt(dragTargetElement.targetSurv)

                let newTargetItem = null;

                if (sourceItemID != null) { // If the source item ID is not null, get the item by ID
                    newTargetItem = GetItemById(sourceItemID)
                }
                
                SurvivorItems[sourceSurv] = newSourceItem;
                SurvivorItems[targetSurv] = newTargetItem;

                // Swap addons
                SurvivorAddons[sourceSurv] = dragTargetElement.targetItemAddons;
                SurvivorAddons[targetSurv] = sourceItemAddons;
            }

            if (Config.saveBuilds) {
                localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
                localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
            }
            UpdatePerkUI();
            CheckForBalancingErrors();
        });

        itemElement.dataset.survivorID = validChildI;

        let itemImg = document.createElement("img");
        itemImg.src = itemSrc;

        itemElement.appendChild(itemImg);
        currentChild.appendChild(itemElement);

        // CSS bugs out if we do this so I'm leaving it out for now.
        //if (SurvivorItems[validChildI] == undefined) { continue; }

        // Get current survivor addons
        let currentSurvivorAddons = SurvivorAddons[validChildI];

        // Create addon elements
        let addonElement1 = document.createElement("div");
        addonElement1.classList.add("addon-slot");
        addonElement1.classList.add("loadout-slot");

        let addonElement2 = document.createElement("div");
        addonElement2.classList.add("addon-slot");
        addonElement2.classList.add("loadout-slot");

        let addonSrc1 = "";
        let addonSrc2 = "";
        try {
            addonSrc1 = currentSurvivorAddons[0]["icon"];
        } catch (error) {
            addonSrc1 = "public/Addons/blank.webp";
        }
        try {
            addonSrc2 = currentSurvivorAddons[1]["icon"];
        } catch (error) {
            addonSrc2 = "public/Addons/blank.webp";
        }

        addonElement1.dataset.survivorID = validChildI;
        addonElement2.dataset.survivorID = validChildI;

        addonElement1.dataset.addonSlot = 0;
        addonElement2.dataset.addonSlot = 1;

        let addonImg1 = document.createElement("img");
        addonImg1.src = addonSrc1;
        addonImg1.draggable = false;

        let addonImg2 = document.createElement("img");
        addonImg2.src = addonSrc2;
        addonImg2.draggable = false;

        addonElement1.appendChild(addonImg1);
        addonElement2.appendChild(addonImg2);

        currentChild.appendChild(addonElement1);
        currentChild.appendChild(addonElement2);

        validChildI++;
    }

    LoadPerkSelectionEvents();
}

function UpdateKillerSelectionUI() {
    var selectedKillerTitle = document.getElementById("selected-killer-title");
    selectedKillerTitle.innerHTML = `Selected Killer: <span style="font-weight:700;">${Killers[selectedKiller]}</span>`;
    
    // Remove all character-selected classes
    if(document.querySelector(`.character-selected`)) {
        document.querySelector(`.character-selected`).classList.remove("character-selected")
    }
    
    // Add character-selected class to selected killer
    document.querySelector(`[data-killerid="${selectedKiller}"]`).classList.add("character-selected")
}

function ScrollToSelectedKiller(){
    document.getElementById("character-select-grid").scrollTo({
        top : document.querySelector(`[data-killerid="${selectedKiller}"]`).getBoundingClientRect().top + document.getElementById("character-select-grid").scrollTop - 102,
        behavior: "smooth"
    })
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

        if (!ValidateCustomBalancing(BalancePresets[currentBalancingIndex]["Balancing"])) {
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

    LoadImageGenEvents();

    LoadPerkSearchEvents();

    LoadRoomEvents();
}

function GetExportData() {
    const survivorPerksId = new Array()
    for(const surv of SurvivorPerks){
        const perksId = new Array()
        for(const perk of surv){
            if (perk == null) {
                perksId.push(null)
                continue;
            }

            perksId.push(perk.id)
        }
        survivorPerksId.push(perksId)
    }

    const survivorOfferingsId = new Array()
    for(const offering of SurvivorOfferings){
        if (offering == null) {
            survivorOfferingsId.push(null)
            continue;
        }

        survivorOfferingsId.push(offering?.id)
    }

    const survivorItemsId = new Array()
    const survivorAddonInfo = new Array()

    for (var i = 0; i < SurvivorItems.length; i++) {
        survivorItemsId.push(SurvivorItems[i]?.id);

        const currentAddons = SurvivorAddons[i];

        survivorAddonInfo.push(
            [
                [
                    currentAddons[0]?.id,
                    currentAddons[1]?.id
                ],
                SurvivorItems[i] == null ? null : SurvivorItems[i]["Type"]
            ]
        );
    }


    const exportJson = {
        "survivorPerksId": survivorPerksId,
        "survivorOfferingsId": survivorOfferingsId,
        "survivorItemsId": survivorItemsId,
        "survivorAddonInfo": survivorAddonInfo,
        "selectedKiller": selectedKiller,
        "currentBalancingIndex": currentBalancingIndex,
        "customBalanceOverride": customBalanceOverride,
        "onlyShowNonBanned": onlyShowNonBanned,
        "currentBalancing": customBalanceOverride ? currentBalancing : null
    }

    console.log(exportJson);

    const exportData = JSON.stringify(exportJson);

    const deflate = pako.deflate(exportData, { to: "string" });
    const compressedText = btoa(String.fromCharCode.apply(null, deflate));

    return compressedText;
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

            console.log(importDataObj);

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

            // survCpt is the current survivor we're on
            let survCpt = 0

            // perkCpt is the current perk we're on
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
                console.log(addonInfo);
                SurvivorAddons[survCpt] = [GetAddonById(addonInfo[1], addonInfo[0][0]), GetAddonById(addonInfo[1], addonInfo[0][1])];
                survCpt++;
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
                localStorage.setItem("selectedKiller", selectedKiller);
            }
            localStorage.setItem("currentBalancingIndex", currentBalancingIndex);
            localStorage.setItem("customBalanceOverride", customBalanceOverride);

            // Update UI
            UpdatePerkUI();
            UpdateBalancingDropdown();
            CheckForBalancingErrors();
            UpdateKillerSelectionUI();
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
        navigator.clipboard.writeText(compressedText);

        GenerateAlertModal("Export Successful", "Your builds data has been copied to your clipboard!");
    });
}

function LoadImageGenEvents() {
    const genImgButton = document.getElementById("generate-image-button");

    genImgButton.addEventListener("click", function() {
        let exportData = GetExportData();

        const imageGenContainer = document.getElementById("image-gen-container");
        imageGenContainer.hidden = false;

        const imageGenTitle = document.getElementById("image-gen-title");
        imageGenTitle.innerText = "Generating Image...";

        const imageGenImage = document.getElementById("image-gen-image");
        imageGenImage.hidden = true;

        const imageGenMessage = document.getElementById("image-gen-message");
        imageGenMessage.innerText = "Please wait while your loadout image is generated...";

        var xhttp = new XMLHttpRequest();
        
        const imageGenOkButton = document.getElementById("image-gen-ok-button");
        imageGenOkButton.innerText = "Cancel";

        imageGenOkButton.addEventListener("click", function() {
            // If the xhttp request is still running, abort it
            if (xhttp.readyState != 4) {
                xhttp.abort();
            }

            imageGenContainer.hidden = true;
        });

        xhttp.responseType = "arraybuffer"

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                switch (this.status) {
                    case 200:
                        // This is the encoded image data.
                        let imageBuffer = this.response;

                        const imageBlob = new Blob([imageBuffer], { type: "image/png" });

                        const imageUrl = URL.createObjectURL(imageBlob);

                        const imageElement = document.getElementById("image-gen-image");
                        imageElement.src = imageUrl;
                        imageElement.hidden = false;

                        imageGenTitle.innerText = "Generated Loadout Image";

                        imageGenMessage.innerText = "Your loadout image has been generated! Feel free to save/copy it.";

                        imageGenOkButton.addEventListener("click", function() {
                            // Revoke the image URL
                            URL.revokeObjectURL(imageUrl);
                        });
                        imageGenOkButton.innerText = "Close";
                    break;
                    default:
                        GenerateAlertModal("Error", "An error occurred while generating your image.");
                        console.error("Error getting image: " + this.status);
                }
            }
        };
        xhttp.open("POST", "/get-build-image", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify({
            ExportData: exportData
        }));
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

            ScrollToSelectedKiller();

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
        }
    });
}

/**
 * Searches for perks based on a search query.
 * @param {HTMLElement} perkSearchBar The perk search bar element.
 * @param {*} value The value to search for. Default "".
 */
function ForcePerkSearch(perkSearchBar, value = "") {
    var searchResults = SearchForPerks(perkSearchBar.value, true);

    perkSearchBar.placeholder = "Search Perks...";

    var perkSearchResultsContainer = document.getElementById("perk-search-results-module");
    perkSearchResultsContainer.classList.remove("item-gap-format");
    perkSearchResultsContainer.innerHTML = "";

    // Add a blank perk to the top of the list
    let blankPerk = document.createElement("div");
    blankPerk.classList.add("perk-slot-result");

    let blankImg = document.createElement("img");
    blankImg.draggable = false;
    blankImg.src = "public/Perks/blank.webp";

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
        perkImg.draggable = false;
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

function ForceOfferingSearch(perkSearchBar, value = "") {
    let isSurvivor = true;

    perkSearchBar.placeholder = "Search Offerings...";

    let searchResults = SearchForOfferings(perkSearchBar.value, isSurvivor);

    let offeringSearchResultsContainer = document.getElementById("perk-search-results-module");
    offeringSearchResultsContainer.classList.remove("item-gap-format");
    offeringSearchResultsContainer.innerHTML = "";

    // Add a blank offering to the top of the list
    let blankOffering = document.createElement("div");
    blankOffering.classList.add("perk-slot-result");
    blankOffering.classList.add("offering-slot-result");

    let blankImg = document.createElement("img");
    blankImg.draggable = false;
    blankImg.src = "public/Offerings/blank.webp";

    blankOffering.appendChild(blankImg);
    offeringSearchResultsContainer.appendChild(blankOffering);

    let offeringSearchContainer = document.getElementById("perk-search-container");
    blankOffering.addEventListener("click", function() {
        let targetSurvivor = parseInt(offeringSearchContainer.dataset.targetSurvivor);

        SurvivorOfferings[targetSurvivor] = undefined;

        UpdatePerkUI();

        offeringSearchContainer.dataset.targetSurvivor = undefined;

        CheckForBalancingErrors();
        if (Config.saveBuilds) {
            localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
        }
    });

    blankOffering.addEventListener("mouseover", function() {
        let perkTooltip = document.getElementById("perk-highlight-name");

        perkTooltip.innerText = "Blank Offering";
    });

    const bannedOfferings = GetBannedOfferings();
    const OfferingRole = isSurvivor ? "Survivor" : "Killer";
    for (var i = 0; i < searchResults.length; i++) {
        let currentOffering = searchResults[i];

        let isBanned = false;
        
        let offeringElement = document.createElement("div");
        offeringElement.classList.add("perk-slot-result");
        offeringElement.classList.add("offering-slot-result");

        DebugLog(`OfferingRole: ${OfferingRole}`)
        // Check if the offering is banned.
        if(bannedOfferings[OfferingRole].includes(currentOffering["id"])){
            DebugLog(`Banned offering: ${currentOffering["id"]}`)
            isBanned = true;
        }

        // Add classes based on offering status
        if (isBanned) {
            offeringElement.classList.add("offering-slot-result-banned");
        }

        offeringElement.dataset.offeringID = currentOffering["id"];

        let offeringImg = document.createElement("img");
        offeringImg.draggable = false;
        offeringImg.src = currentOffering["icon"];

        offeringElement.appendChild(offeringImg);
        offeringSearchResultsContainer.appendChild(offeringElement);

        offeringElement.addEventListener("click", function() {
            let targetSurvivor = parseInt(offeringSearchContainer.dataset.targetSurvivor);

            SurvivorOfferings[targetSurvivor] = currentOffering;

            UpdatePerkUI();

            offeringSearchContainer.dataset.targetSurvivor = undefined;

            CheckForBalancingErrors();

            SendRoomDataUpdate();
            if (Config.saveBuilds) {
                localStorage.setItem("SurvivorOfferings", JSON.stringify(SurvivorOfferings));
            }
        });

        offeringElement.addEventListener("mouseover", function() {
            let perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerHTML = currentOffering["name"];

            if (isBanned) {
                perkTooltip.innerHTML += " <span style='color: #ff8080'>(Banned)</span>";
            }
        });
    }
}

function ForceItemSearch(perkSearchBar, value = "") {
    perkSearchBar.placeholder = "Search Items...";

    let searchResults = SearchForItems(perkSearchBar.value);

    let itemSearchResultsContainer = document.getElementById("perk-search-results-module");

    itemSearchResultsContainer.innerHTML = "";
    itemSearchResultsContainer.classList.add("item-gap-format");

    // Add a blank item to the top of the list
    let blankItem = document.createElement("div");
    blankItem.classList.add("item-slot-result");

    let blankImg = document.createElement("img");
    blankImg.draggable = false;
    blankImg.src = "public/Items/blank.webp";

    blankItem.appendChild(blankImg);
    itemSearchResultsContainer.appendChild(blankItem);

    let itemSearchContainer = document.getElementById("perk-search-container");
    blankItem.addEventListener("click", function() {
        let targetSurvivor = parseInt(itemSearchContainer.dataset.targetSurvivor);

        SurvivorItems[targetSurvivor] = undefined;

        // Reset addons
        SurvivorAddons[targetSurvivor] = [undefined, undefined];

        UpdatePerkUI();

        itemSearchContainer.dataset.targetSurvivor = undefined;

        CheckForBalancingErrors();
        if (Config.saveBuilds) {
            localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
            localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
        }
    });

    blankItem.addEventListener("mouseover", function() {
        let perkTooltip = document.getElementById("perk-highlight-name");

        perkTooltip.innerText = "Blank Item";
    });

    const bannedItems = GetBannedItems();
    for (var i = 0; i < searchResults.length; i++) {
        let currentItem = searchResults[i];

        let isBanned = false;
        
        let itemElement = document.createElement("div");
        itemElement.classList.add("item-slot-result");

        // Check if the item is banned.
        if(bannedItems.includes(currentItem["id"])){
            isBanned = true;
        }

        // Add classes based on item status
        if (isBanned) {
            itemElement.classList.add("item-slot-result-banned");
        }

        itemElement.dataset.itemID = currentItem["id"];

        let itemImg = document.createElement("img");
        itemImg.draggable = false;
        itemImg.src = currentItem["icon"];

        itemElement.appendChild(itemImg);
        itemSearchResultsContainer.appendChild(itemElement);

        itemElement.addEventListener("click", function() {
            let targetSurvivor = parseInt(itemSearchContainer.dataset.targetSurvivor);

            let currentSurvivorItem = SurvivorItems[targetSurvivor];
            
            let equalItemTypes = false;
            if (currentSurvivorItem != undefined && currentItem != undefined) {
                equalItemTypes = currentSurvivorItem["Type"] == currentItem["Type"];
            }
            
            SurvivorItems[targetSurvivor] = currentItem;

            // Reset addons if the item type is different
            if (!equalItemTypes) {
                SurvivorAddons[targetSurvivor] = [undefined, undefined];
            }
            UpdatePerkUI();

            itemSearchContainer.dataset.targetSurvivor = undefined;

            CheckForBalancingErrors();

            SendRoomDataUpdate();
            if (Config.saveBuilds) {
                localStorage.setItem("SurvivorItems", JSON.stringify(SurvivorItems));
                localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
            }
        });

        itemElement.addEventListener("mouseover", function() {
            let perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerHTML = currentItem["Name"];

            if (isBanned) {
                perkTooltip.innerHTML += " <span style='color: #ff8080'>(Banned)</span>";
            }
        });
    }

}

function ForceAddonSearch(perkSearchBar, value = "") {
    perkSearchBar.placeholder = "Search Addons...";

    const perkSearchContainer = document.getElementById("perk-search-container");
    
    let filterData = {
        "itemType": perkSearchContainer.dataset.itemType,
        "addonSlot": perkSearchContainer.dataset.addonSlot
    }

    if (perkSearchContainer.dataset.itemType == undefined) { 
        GenerateAlertModal("Item Persistence Error", "There was an error finding the item type to search appropriate addons. Please try again or file an issue on the GitHub page.");
        return;
    }
    let searchResults = SearchForAddons(perkSearchBar.value, filterData["itemType"]);

    let addonSearchResultsContainer = document.getElementById("perk-search-results-module");

    addonSearchResultsContainer.innerHTML = "";
    addonSearchResultsContainer.classList.add("item-gap-format");

    // Add a blank addon to the top of the list
    let blankAddon = document.createElement("div");
    blankAddon.classList.add("item-slot-result");

    let blankImg = document.createElement("img");
    blankImg.draggable = false;
    blankImg.src = "public/Addons/blank.webp";

    blankAddon.appendChild(blankImg);
    addonSearchResultsContainer.appendChild(blankAddon);

    blankAddon.addEventListener("click", function() {
        let targetSurvivor = parseInt(perkSearchContainer.dataset.targetSurvivor);

        SurvivorAddons[targetSurvivor][filterData["addonSlot"]] = undefined;

        UpdatePerkUI();

        perkSearchContainer.dataset.targetSurvivor = undefined;

        CheckForBalancingErrors();
        if (Config.saveBuilds) {
            localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
        }
    });

    blankAddon.addEventListener("mouseover", function() {
        let perkTooltip = document.getElementById("perk-highlight-name");

        perkTooltip.innerText = "Blank Addon";
    });

    const bannedAddons = GetBannedAddons(filterData["itemType"]);
    for (var i = 0; i < searchResults.length; i++) {
        let currentAddon = searchResults[i];

        let isBanned = false;

        let addonElement = document.createElement("div");
        addonElement.classList.add("item-slot-result");

        // Check if the addon is banned.
        if(bannedAddons.includes(currentAddon["id"])){
            isBanned = true;
        }

        // Add classes based on addon status
        if (isBanned) {
            addonElement.classList.add("item-slot-result-banned");
        }

        addonElement.dataset.addonID = currentAddon["id"];
        addonElement.dataset.itemType = filterData["itemType"];

        let addonImg = document.createElement("img");
        addonImg.draggable = false;
        addonImg.src = currentAddon["icon"];

        addonElement.appendChild(addonImg);
        addonSearchResultsContainer.appendChild(addonElement);

        addonElement.addEventListener("click", function() {
            let targetSurvivor = parseInt(perkSearchContainer.dataset.targetSurvivor);

            SurvivorAddons[targetSurvivor][filterData["addonSlot"]] = currentAddon;

            UpdatePerkUI();

            perkSearchContainer.dataset.targetSurvivor = undefined;

            CheckForBalancingErrors();

            SendRoomDataUpdate();
            if (Config.saveBuilds) {
                localStorage.setItem("SurvivorAddons", JSON.stringify(SurvivorAddons));
            }
        });

        addonElement.addEventListener("mouseover", function() {
            let perkTooltip = document.getElementById("perk-highlight-name");

            perkTooltip.innerHTML = currentAddon["Name"];

            if (isBanned) {
                perkTooltip.innerHTML += " <span style='color: #ff8080'>(Banned)</span>";
            }
        });
    }
}

function SearchForPerks(searchQuery, isSurvivor) {
    var searchResults = [];

    let bannedPerks = new Array()
    if(onlyShowNonBanned){
        bannedPerks = GetBannedPerks()
    }

    for (var i = 0; i < Perks.length; i++) {
        if(Perks[i].name.toLowerCase().includes(searchQuery.toLowerCase())) {

            if((onlyShowNonBanned && bannedPerks.includes(Perks[i].id + ""))) { continue; }
            
            if(Perks[i].survivorPerk == isSurvivor){
                searchResults.push(Perks[i]);
            }
        }
    }

    return searchResults;   
}

function SearchForOfferings(searchQuery, isSurvivor) {
    var searchResults = [];

    let bannedOfferings = new Array()
    if(onlyShowNonBanned){
        bannedOfferings = GetBannedOfferings()
    }

    const OfferingsRole = isSurvivor ? "Survivor" : "Killer"
    const bannedOffInRole = bannedOfferings[OfferingsRole]
    for (var i = 0; i < Offerings[OfferingsRole].length; i++) {

        if (Offerings[OfferingsRole][i].name.toLowerCase().includes(searchQuery.toLowerCase())) {
            if((onlyShowNonBanned && bannedOffInRole.includes(Offerings[OfferingsRole][i].id))) { continue; }
            
            searchResults.push(Offerings[OfferingsRole][i]);
        }
    }

    return searchResults;
}

function SearchForItems(searchQuery) {
    var searchResults = [];

    let bannedItems = new Array()
    if(onlyShowNonBanned){
        bannedItems = GetBannedItems()
    }

    for (var i = 0; i < Items["Items"].length; i++) {
        let currentItem = Items["Items"][i];
        if (currentItem["Name"].toLowerCase().includes(searchQuery.toLowerCase())) {
            if((onlyShowNonBanned && bannedItems.includes(currentItem.id))) { continue; }

            searchResults.push(currentItem);
        }
    }

    return searchResults;
}

function SearchForAddons(searchQuery, itemType) {
    var searchResults = [];

    let bannedAddons = new Array()
    if (onlyShowNonBanned) {
        bannedAddons = GetBannedAddons(itemType);
    }

    let itemTypeIndex = GetIndexOfItemType(itemType);
    let addonList = Items["ItemTypes"][itemTypeIndex]["Addons"];
    DebugLog(addonList);
    for (var i = 0; i < addonList.length; i++) {
        let currentAddon = addonList[i];
        if (currentAddon["Name"].toLowerCase().includes(searchQuery.toLowerCase())) {
            if ((onlyShowNonBanned && bannedAddons.includes(currentAddon.id))) { continue; }

            searchResults.push(currentAddon);
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
            GetItems();
        }
    }
    xhttp.open("GET", "Addons.json", false);
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

    let concatenatedWhitelist = new Array()

    // Concatenate KillerWhitelistedPerks and SurvivorWhitelistedPerks
    concatenatedWhitelist = concatenatedWhitelist.concat(currentBalancing.KillerOverride[selectedKiller].KillerWhitelistedPerks)
    concatenatedWhitelist = concatenatedWhitelist.concat(currentBalancing.KillerOverride[selectedKiller].SurvivorWhitelistedPerks)
    console.log(`Concatenated whitelist: ${concatenatedWhitelist}`)

    for (const perk of concatenatedWhitelist) {
        // If the perk is in the banned perks, remove it
        if (bannedPerks.includes(perk)) {
            bannedPerks.splice(bannedPerks.indexOf(perk), 1);
        }
    }

    return bannedPerks;
}

function GetBannedOfferings() {

    DebugLog("Is current balancing set?");
    DebugLog(currentBalancing);

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (Offerings == undefined) { return null; }

    let bannedOfferings = {
        "Survivor": new Array(),
        "Killer": new Array()
    }

    // Get survivor offerings from killer override
    let survivorOfferings = currentBalancing.KillerOverride[selectedKiller].SurvivorOfferings;

    // Get killer offerings from killer override
    let killerOfferings = currentBalancing.KillerOverride[selectedKiller].KillerOfferings;

    for (const offering of Offerings["Survivor"]) {
        // If the offering is not in the survivor offerings, add it to the banned offerings
        if (!survivorOfferings.includes(offering.id)) {
            bannedOfferings["Survivor"].push(offering.id);
        }
    }

    for (const offering of Offerings["Killer"]) {
        // If the offering is not in the killer offerings, add it to the banned offerings
        if (!killerOfferings.includes(offering.id)) {
            bannedOfferings["Killer"].push(offering.id);
        }
    }

    return bannedOfferings;
}

function GetBannedItems() {
    DebugLog("Is current balancing set?");
    DebugLog(currentBalancing);

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (Items == undefined) { return null; }

    let bannedItems = new Array()

    // Get items from killer override
    let items = currentBalancing.KillerOverride[selectedKiller].ItemWhitelist;
    if (items == undefined) { return null; }
    DebugLog("ITEMS:")
    DebugLog(items);
    
    for (const item of Items["Items"]) {
        // If the item is not in the items, add it to the banned items
        //DebugLog(`Checking if ${item.id} is in ${items}`);
        if (!items.includes(item.id)) {
            //DebugLog(`${item.id} is not in ${items}`);
            bannedItems.push(item.id);
        }
    }

    return bannedItems;
}

function GetBannedAddons(itemType) {
    DebugLog("Is current balancing set?");
    DebugLog(currentBalancing);

    if (currentBalancing == undefined || currentBalancing == {}) { return null; }
    if (Items == undefined) { return null; }

    let bannedAddons = new Array()

    // Get addons from killer override
    let whitelistedAddons = currentBalancing.KillerOverride[selectedKiller].AddonWhitelist[itemType]["Addons"];
    let addonList = Items["ItemTypes"][GetIndexOfItemType(itemType)]["Addons"];

    //console.log(whitelistedAddons);
    for (const addon of addonList) {
        // If the addon is not in the addons, add it to the banned addons
        if (!whitelistedAddons.includes(addon.id)) {
            bannedAddons.push(addon.id);
        }
    }

    return bannedAddons;
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
                        DebugLog(`Loaded balancing for ${currentPreset["Name"]}`);
                        DebugLog(`Balancing string: ${this.responseText}`);
                        DebugLog(JSON.parse(this.responseText));
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
                        `Perk <b>${currentPerk["name"]}</b> is repeated ${perkRepeatAmount} times in the Survivor builds.`,
                        undefined,
                        "iconography/PerkError.webp"
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
                        undefined,
                        "iconography/PerkError.webp",
                        true
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
                        undefined,
                        "iconography/ComboError.webp"
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
                            undefined,
                            "iconography/ComboError.webp"
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
                        undefined,
                        "iconography/PerkError.webp"
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
                            undefined,
                            "iconography/PerkError.webp"
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

    var currentOverride = currentBalancing.KillerOverride[selectedKiller];
    DebugLog("Current Override:");
    DebugLog(currentOverride);

    // Reset banned offerings
    let offerings = document.getElementsByClassName("offering-slot");
    for (var offering of offerings) {
        offering.classList.remove("banned-offering");
    }

    // Check for banned offerings
    for (var i = 0; i < SurvivorOfferings.length; i++) {
        let bannedOfferings = GetBannedOfferings();

        if (SurvivorOfferings[i] == undefined) { continue; }
        if (bannedOfferings["Survivor"].includes(SurvivorOfferings[i]["id"])) {
            
            let offerings = document.getElementsByClassName("offering-slot");
            offerings[i].classList.add("banned-offering");

            MasterErrorList.push(
                GenerateErrorObject(
                    "Banned Offering",
                    `Offering <b>${SurvivorOfferings[i]["name"]}</b> is banned against <b>${currentOverride["Name"]}</b>. It is present in <b>Survivor #${i+1}</b>'s build.`,
                    undefined,
                    "iconography/OfferingError.webp"
                )
            );
        }
    }

    // Reset banned items
    let items = document.getElementsByClassName("item-slot");
    for (var item of items) {
        item.classList.remove("banned-item");
    }

    // Check for banned items
    for (var i = 0; i < SurvivorItems.length; i++) {
        let bannedItems = GetBannedItems();

        if (SurvivorItems[i] == undefined) { continue; }
        if (bannedItems.includes(SurvivorItems[i]["id"])) {
            let items = document.getElementsByClassName("item-slot");
            items[i].classList.add("banned-item");

            MasterErrorList.push(
                GenerateErrorObject(
                    "Banned Item",
                    `Item <b>${SurvivorItems[i]["Name"]}</b> is banned against <b>${currentOverride["Name"]}</b>. It is present in <b>Survivor #${i+1}</b>'s build.`,
                    undefined,
                    "iconography/ItemError.webp"
                )
            );
        }
    }

    // Reset banned addons
    let addons = document.getElementsByClassName("addon-slot");
    for (var addon of addons) {
        addon.classList.remove("banned-addon");
        addon.classList.remove("duplicate-addon");
    }

    // Check for banned addons
    for (var i = 0; i < SurvivorItems.length; i++) {
        console.log(`Checking for banned addons on Survivor #${i}...`)
        let currentItem = SurvivorItems[i];

        if (currentItem == undefined) { 
            continue; 
        }
        if (currentItem["Type"] == undefined) { 
            continue; 
        }

        const itemType = currentItem["Type"];
        const bannedAddons = GetBannedAddons(itemType);

        if (bannedAddons == undefined) {
            continue;
        }

        addonIDs = [];
        for (var j = 0; j < SurvivorAddons[i].length; j++) {
            console.log(`\tChecking for banned addons on Survivor #${i} at addon slot #${j}...`)
            let currentAddon = SurvivorAddons[i][j];

            if (currentAddon == undefined) {
                continue;
            }

            addonIDs.push(currentAddon);
            console.log(`\t\tPushed ${currentAddon["Name"]} to addonIDs.`);
            if (bannedAddons.includes(currentAddon["id"])) {
                let addons = document.getElementsByClassName("addon-slot");
                for (var addon of addons) {
                    if (addon.dataset.survivorID == i && addon.dataset.addonSlot == j) {
                        addon.classList.add("banned-addon");
                    }
                }

                MasterErrorList.push(
                    GenerateErrorObject(
                        "Banned Addon",
                        `Addon <b>${currentAddon["Name"]}</b> is banned against <b>${currentOverride["Name"]}</b>. It is present in <b>Survivor #${i+1}</b>'s build at <b>Addon Slot #${j+1}</b>.`,
                        undefined,
                        "iconography/AddonError.webp"
                    )
                );
            }   
        }

        console.log(`\tFinal addonIDs:`);
        console.log(addonIDs);

        // Check if every size-two addon permutation is a duplicate or not
        for (var j = 0; j < addonIDs.length; j++) {
            for (var k = j+1; k < addonIDs.length; k++) {
                console.log(`\t\tChecking if ${addonIDs[j]["Name"]} is a duplicate of ${addonIDs[k]["Name"]}...`)
                let currentAddonID = addonIDs[j]["id"];
                let otherAddonID = addonIDs[k]["id"];

                if (currentAddonID == undefined || otherAddonID == undefined) { continue; }

                if (currentAddonID == otherAddonID) {
                    console.log('\t\t\t<b>Duplicate detected!</b>')

                    let addons = document.getElementsByClassName("addon-slot");
                    for (var addon of addons) {
                        if (addon.dataset.survivorID == i && addon.dataset.addonSlot == j) {
                            addon.classList.add("duplicate-addon");
                        }
                        if (addon.dataset.survivorID == i && addon.dataset.addonSlot == k) {
                            addon.classList.add("duplicate-addon");
                        }
                    }

                    MasterErrorList.push(
                        GenerateErrorObject(
                            "Duplicate Addon",
                            `Addon <b>${addonIDs[j]["Name"]}</b> is duplicated in <b>Survivor #${i+1}</b>'s build.`,
                            undefined,
                            "iconography/AddonError.webp",
                            true
                        )
                    );
                    console.log('\t\t\t<b>Pushed error to MasterErrorList!</b>')
                }
            }
        }
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
        if (currentError["CRITICAL"]) {
            errorIcon.classList.add("error-icon-critical");
        }

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
 * A function to get the ID of a perk based on its file name.
 * @param {string} fileName The file name of the perk.
 * @returns {number} The ID of the perk.
 */
function GetPerkIdByFileName(fileName){
    for(const perk of Perks){
        if(perk.icon == fileName) return perk.id
    }
}

/**
 * A function to get a perk object by its ID.
 * @param {number} id The ID of the perk.
 * @returns {object} The perk object.
 */
function GetPerkById(id){
    for(const perk of Perks){
        if(perk.id == id) return perk
    }
}

/**
 * A function to get the ID of an offering based on its file name.
 * @param {string} fileName The file name of the offering.
 * @returns {number} The ID of the offering.
 */
function GetOfferingIdByFileName(fileName){
    let SurvivorOfferings = Offerings["Survivor"];
    let KillerOfferings = Offerings["Killer"];

    for(const offering of SurvivorOfferings){
        if(offering.icon == fileName) return offering.id
    }

    for(const offering of KillerOfferings){
        if(offering.icon == fileName) return offering.id
    }
}

function GetItemIdByFileName(fileName) {
    let itemsList = Items["Items"];

    for (var i = 0; i < itemsList.length; i++) {
        let currentItem = itemsList[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["icon"] == fileName) {
            return currentItem["id"];
        }
    }

    return undefined;
}

/**
 * A function to get an offering object by its ID.
 * @param {number} id The ID of the offering.
 * @returns {object} The offering object.
 */
function GetOfferingById(id){
    let SurvivorOfferings = Offerings["Survivor"];
    let KillerOfferings = Offerings["Killer"];

    for(const offering of SurvivorOfferings){
        if(offering.id == id) return offering
    }

    for(const offering of KillerOfferings){
        if(offering.id == id) return offering
    }
}

function GetItemById(id) {
    let itemsList = Items["Items"];

    for (var i = 0; i < itemsList.length; i++) {
        let currentItem = itemsList[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["id"] == id) {
            return currentItem;
        }
    }

    return undefined;
}

/**
 * A function to get the name of an addon based on its ID.
 * @param {string} itemType The type of item the addon belongs to.
 * @param {number} id The ID of the addon.
 */
function GetAddonById(itemType, id) {
    if (Items == undefined) { return undefined; }

    let ItemTypes = Items["ItemTypes"];
    if (ItemTypes == undefined) { return undefined; }

    // Find item type index
    let itemTypeIndex = undefined;
    for (var i = 0; i < ItemTypes.length; i++) {
        let currentItem = ItemTypes[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["Name"] == itemType) {
            itemTypeIndex = i;
            break;
        }
    }
    if (itemTypeIndex == undefined) { return undefined; }

    let addons = ItemTypes[itemTypeIndex]["Addons"];
    if (addons == undefined) { return undefined; }

    for (var i = 0; i < addons.length; i++) {
        let currentAddon = addons[i];

        if (currentAddon == undefined) { continue; }

        if (currentAddon["id"] == id) {
            return currentAddon;
        }
    }

    return undefined;
}

/**
 * A function to get the index of an item type based on its name.
 * @param {string} itemType The name of the item type.
 */
function GetIndexOfItemType(itemType) {
    if (Items == undefined) { return; }

    let ItemTypes = Items["ItemTypes"];
    for (var i = 0; i < ItemTypes.length; i++) {
        let currentItem = ItemTypes[i];

        if (currentItem == undefined) { continue; }

        if (currentItem["Name"] == itemType) {
            return i;
        }
    }

    return -1;
}

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
 * @param {string} name The title of the error.
 * @param {string} reason The reason for the error.
 * @param {string} stacktrace The stacktrace of the error.
 * @param {string} icon The icon to display for the error.
 * @param {boolean} criticalError Whether or not the error is critical.
 * @returns {object} An object containing the error information.
 */
function GenerateErrorObject(
    name = "Default Error",
    reason = "Default Reason",
    stacktrace = undefined,
    icon = "iconography/Error.webp",
    criticalError = false) {
        return {
            ERROR: name,
            REASON: reason,
            STACKTRACE: stacktrace,
            ICON: icon,
            CRITICAL: criticalError
        };
    }

function GenerateAlertModal(
    title,
    message,
    closeCallback = undefined,
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

    if (closeCallback == undefined) { return; }

    alertOkButton.addEventListener("click", function() {
        closeCallback();
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

            if (currentOverride["ItemWhitelist"] == undefined) { return false; }
            if (currentOverride["AddonWhitelist"] == undefined) { return false; }

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