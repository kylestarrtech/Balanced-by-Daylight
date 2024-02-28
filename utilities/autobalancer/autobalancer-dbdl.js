const natural = require('natural')

const Killers = require('../../public/Killers.json')
const Perks = require('../../public/Perks/dbdperks.json')
const Items = require('../../public/Items.json')
const Offerings = require('../../public/Offerings.json')
const KillerAddons = require('../../public/NewAddons.json')
const Maps = require('../../public/NewMaps.json')

const perksName = Perks.map(perk => perk.name)
const mapsName = Maps.map(map => map.Name)
const killerOfferingsName = Offerings.Killer.map(offering => offering.name)
const survivorOfferingsName = Offerings.Survivor.map(offering => offering.name)
const itemsName = Items.Items.map(item => item.Name)

const replaceItemName = new Map()
    .set("Purple Medkit", "Ranger Med-Kit")
    .set("Brown Medkit", "Camping Aid Kit")
    .set("Yellow Toolbox", "Toolbox")
    .set("Green Flashlight", "Sport Flashlight")
    .set("Firecracker", "Firecracker")

function getPerkIdByName(name){
    for(const perk of Perks){
        if(perk.name == name){   
            return perk.id
        }
    }
}

function getMapIdByName(name){
    for(const map of Maps){
        if(map.Name == name){   
            return map.ID
        }
    }
}

function getKillerOfferingIdByName(name){
    for(const offering of Offerings.Killer){
        if(offering.name == name){   
            return offering.id
        }
    }
}

function getSurvivorOfferingIdByName(name){
    for(const offering of Offerings.Survivor){
        if(offering.name == name){   
            return offering.id
        }
    }
}

function getItemIdByName(name){
    for(const item of Items.Items){
        if(item.Name == name){   
            return item.id
        }
    }
}

function getIndexOfTier(tiers, tierName){
    for(const tier of tiers){
        if(tier.Name == tierName){
            return tiers.indexOf(tier)
        }
    }
}

function getIdListByNames(baseList, nameList, search){
    const list = new Array()

    for(const perkName of nameList){
        const similarities = baseList.map(text => ({
            text: text,
            similarity: natural.JaroWinklerDistance(perkName, text)
        }))

        const mostSimilarText = similarities.reduce((prev, current) => (prev.similarity > current.similarity) ? prev : current).text
        
        list.push(search(mostSimilarText))
    }
    
    return list
}

function replacePerkNamesById(tier){
    tier.SurvivorIndvPerkBans = getIdListByNames(perksName, tier.SurvivorIndvPerkBans, getPerkIdByName)
    tier.KillerIndvPerkBans = getIdListByNames(perksName, tier.KillerIndvPerkBans, getPerkIdByName)

    let combos = new Array()
    for(const combo of tier.SurvivorComboPerkBans){
        combos.push(getIdListByNames(perksName, combo, getPerkIdByName))
    }
    tier.SurvivorComboPerkBans = combos

    combos = new Array()
    for(const combo of tier.KillerComboPerkBans){
        combos.push(getIdListByNames(perksName, combo, getPerkIdByName))
    }
    tier.KillerComboPerkBans = combos
}

module.exports = function(balancingText) {
    for(const tier of balancingText.Tiers){
        replacePerkNamesById(tier)
    }

    for(const killer of balancingText.KillerOverride){
        const similarities = Killers.map(text => ({
            text: text,
            similarity: natural.JaroWinklerDistance(killer.Name, text)
        }))
        killer.Name = similarities.reduce((prev, current) => (prev.similarity > current.similarity) ? prev : current).text

        let tiers = new Array()
        for(const tier of killer.BalanceTiers){
            tiers.push(getIndexOfTier(balancingText.Tiers, tier))
        }
        killer.BalanceTiers = tiers

        tiers = new Array()
        for(const tier of killer.SurvivorBalanceTiers){
            tiers.push(getIndexOfTier(balancingText.Tiers, tier))
        }
        killer.SurvivorBalanceTiers = tiers

        replacePerkNamesById(killer)
        killer.Map = getIdListByNames(mapsName, killer.Map, getMapIdByName)
        killer.KillerOfferings = getIdListByNames(killerOfferingsName, killer.KillerOfferings, getKillerOfferingIdByName)
        killer.SurvivorOfferings = getIdListByNames(survivorOfferingsName, killer.SurvivorOfferings, getSurvivorOfferingIdByName)

        let addons
        for(const k of KillerAddons){
            if(k.Name == killer.Name){
                addons = k.Addons
                break
            }
        }
        const addonsName = addons.map(addon => addon.Name)

        function getAddonIdByName(name){
            for(const addon of addons){
                if(addon.Name == name){   
                    return addon.globalID
                }
            }
        }
        
        killer.IndividualAddonBans.splice(killer.IndividualAddonBans.indexOf("Blight Serum"), 1)
        killer.IndividualAddonBans = getIdListByNames(addonsName, killer.IndividualAddonBans, getAddonIdByName)

        const items = new Array()
        for(const item of killer.ItemWhitelist){
            items.push(replaceItemName.get(item))
        }
        killer.ItemWhitelist = getIdListByNames(itemsName, items, getItemIdByName)

        const addonWhitelist = {
            "Firecracker": { Addons: [] },
            "Flashlight": { Addons: [] },
            "Med-Kit": { Addons: [] },
            "Toolbox": { Addons: [] },
            "Key": { Addons: [] },
            "Map": { Addons: [] }
        }
        if(killer.AddonWhitelist.includes("Flashlight - Brown Addons")){
            addonWhitelist.Flashlight.Addons = [1, 2, 3, 4]
        }
        if(killer.AddonWhitelist.includes("Toolbox - Brown Addons")){
            addonWhitelist.Toolbox.Addons = [0, 1, 2]
        }
        if(killer.AddonWhitelist.includes("Medkit - Brown Charges")){
            addonWhitelist["Med-Kit"].Addons.push(2)
        }
        if(killer.AddonWhitelist.includes("Medkit - Pink Charges")){
            addonWhitelist["Med-Kit"].Addons.push(11)
        }
        killer.AddonWhitelist = addonWhitelist
    }

    return balancingText
}