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

    SetKillerBalancing();

    // Fill listbox with all Survivor perks by default.
    OverrideButtonSearch("", true);

    // Update all tier and killer dropdowns
    UpdateDropdowns();
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