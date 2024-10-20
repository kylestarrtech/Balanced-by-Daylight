/*
Name:
    checker-globals.js
Purpose:
    This file is designed to contain all of the global variables and very trivial initial setups for the balance checker.
*/

var debugging = true;
var overrideStackTrace = false;

var Perks = null;
var Killers = null;
var Survivors = null;
var Maps = null;
var KillerAddonsList = null;
var Offerings = null;
var Items = null;

var Config = null;

var AllDataLoaded = false;

var BalancePresets = [];

var currentBalancingIndex = 0;
var customBalanceOverride = false;
var onlyShowNonBanned = false;
var saveLoadoutsAndKiller = false;
var showNotesOnLaunch = true;

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

KillerPerks = [
    undefined,
    undefined,
    undefined,
    undefined
]

KillerOffering = undefined;

KillerAddons = [
    undefined,
    undefined
]

selectedRole = 0; // 0 = Survivor, 1 = Killer

selectedKiller = 0;
currentBalancingIndex = 0;

// Load settings from local storage.

//if(localStorage.getItem("selectedKiller")) selectedKiller = parseInt(localStorage.getItem("selectedKiller"));
if(localStorage.getItem("currentBalancingIndex")) currentBalancingIndex = parseInt(localStorage.getItem("currentBalancingIndex"));
if(localStorage.getItem("onlyShowNonBanned")) onlyShowNonBanned = localStorage.getItem("onlyShowNonBanned") == "true";
if(localStorage.getItem("saveLoadoutsAndKiller")) saveLoadoutsAndKiller = localStorage.getItem("saveLoadoutsAndKiller") == "true";
if (localStorage.getItem("showNotesOnLaunch")) showNotesOnLaunch = localStorage.getItem("showNotesOnLaunch") == "true";