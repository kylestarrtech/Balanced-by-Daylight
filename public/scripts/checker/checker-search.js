/*
Name:
    checker-search.js
Purpose:
    This file is designed to contain all of the methods in relation to the search feature in the balance checker.
*/

/**
 * Searches for perks based on a query and whether or not the perks are to be searched as survivor or not.
 * @param {string} searchQuery 
 * @param {boolean} isSurvivor 
 * @returns 
 */
function SearchForPerks(searchQuery, isSurvivor) {
    var searchResults = [];

    let bannedPerks = new Array()
    if(onlyShowNonBanned){
        bannedPerks = GetBannedPerks()
    }

    for (var i = 0; i < Perks.length; i++) {
        if(Perks[i].name.toLowerCase().includes(searchQuery.toLowerCase()) || Perks[i].aliases?.toLowerCase().includes(searchQuery.toLowerCase())) {

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
/**
 * Searches for survivor add-ons based on a query and an item type.
 * @param {string} searchQuery 
 * @param {string} itemType 
 * @returns 
 */
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

/**
 * Searches for killer add-ons based on query and killer index.
 * @param {string} searchQuery 
 * @param {number} killer 
 * @returns 
 */
function SearchForKillerAddons(searchQuery, killer) {
    var searchResults = [];

    DebugLog(`Searching for killer addons for ${killer}`);

    let bannedAddons = new Array()
    if (onlyShowNonBanned) {
        bannedAddons = GetBannedKillerAddons();
    }

    let addonList = KillerAddonsList[killer]["Addons"];

    for (var i = 0; i < addonList.length; i++) {
        let currentAddon = addonList[i];

        if (currentAddon["Name"].toLowerCase().includes(searchQuery.toLowerCase())) {
            if ((onlyShowNonBanned && bannedAddons.includes(currentAddon))) { continue; }

            searchResults.push(currentAddon);
        }
    }

    return searchResults;
}