/*
Name:
    checker-resources.js
Purpose:
    This file is designed to contain all of the methods that are designed to get key resources from the server.
*/

function BeginResourceChain() {
    GetBalancings();
}

function GetBalancings() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    BalancePresets = JSON.parse(this.responseText);

                    for (let i = 0; i < BalancePresets.length; i++) {
                        let currentPreset = BalancePresets[i];

                        currentPreset["Balancing"] = undefined;
                    }
                break;
                default:
                    console.error("Error getting balancings: " + this.status);
            }
            GetPerks();
        }
    }
    xhttp.open("GET", "Balancings.json", false);
    xhttp.send();
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
    xhttp.open("GET", "NewMaps.json", false);
    xhttp.send();
}

function GetAddons() {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    KillerAddonsList = JSON.parse(this.responseText);
                break;
                default:
                    console.error("Error getting addons: " + this.status);
            }
            GetItems();
        }
    }
    xhttp.open("GET", "NewAddons.json", false);
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
            
            AllDataLoaded = true;
            main();
        }
    }
    xhttp.open("GET", "Offerings.json", false);
    xhttp.send();
}

function GetBalancingFromPresetID(presetID, success, error) {
    let currentPreset = GetBalancePresetByID(presetID);

    if (currentPreset["Balancing"] !== undefined) {
        success();
        return;
    }

    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                    DebugLog(`Loaded balancing for ${currentPreset["Name"]}`);
                    DebugLog(`Balancing string: ${this.responseText}`);
                    DebugLog(JSON.parse(this.responseText));
                    currentPreset["Balancing"] = JSON.parse(this.responseText);
                    success();
                break;
                default:
                    console.error("Error getting balancing: " + this.status);
                    error();
            }
        }
    }
    xhttp.open("GET", currentPreset["Path"], false);
    xhttp.send();
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