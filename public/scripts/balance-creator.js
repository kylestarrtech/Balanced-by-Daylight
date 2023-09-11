Perks = null;
Killers = null;
Survivors = null;

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

    // Fill listbox with all Survivor perks by default.
    OverrideButtonSearch("", true);

    // Update all tier and killer dropdowns
    UpdateDropdowns();
}

function SetTierButtonEvents() {
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
            BalanceTiers: [0], //Set to 0 for General Tier, which is always created.
            KillerIndvPerkBans: [],
            KillerComboPerkBans: [],
            SurvivorIndvPerkBans: [],
            SurvivorComboPerkBans: [],
            SurvivorWhitelistedPerks: [], // e.g. Skull Merchant sucks ass so we need to give people Potential Energy so games aren't slogs...
            SurvivorWhitelistedComboPerks: [] // In the case some perk combo deserves to be whitelisted for a particular Killer.
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
    searchResultsContainer.innerHTML = "";

    for (var i = 0; i < searchResults.length; i++) {
        var optionsElement = document.createElement("option");
        optionsElement.value = searchResults[i].id;
        optionsElement.innerHTML = searchResults[i].name;
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
        }
        GetSurvivors();
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
        }
    }
    xhttp.open("GET", "Survivors.json", false);
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