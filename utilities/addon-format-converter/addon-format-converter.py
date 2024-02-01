import json

def GetAddonIcon(klrName : str, addonName : str):
    klrName = klrName

    # Remove the "The " from the beginning of the killer name
    if klrName.startswith("The "):
        klrName = klrName[4:]
    
    path = f'public/PowerAddons/{klrName}/'

    addonFileName = addonName.replace("'", "_").replace(" ", "-").replace(":", "").replace("!", "").replace("&", "And")
    
    addonFileName = addonFileName.title() + ".webp"
    
    return path + addonFileName
    

legacyAddonFile = open("LegacyAddons.json", "r")
legacyAddonData = json.load(legacyAddonFile)

legacyAddonFile.close()

newAddonFile = open("NewAddons.json", "w")

finalFileObject = []

globalAddonID = 0
for killer in legacyAddonData:
    killerName = killer["Name"]

    curRarityList = killer["Addons"]

    killerData = {}

    killerData["Name"] = killerName
    killerData["Addons"] = []

    localAddonID = 0
    rarityIndex = 0
    for rarity in curRarityList:
        curRarity = rarity["Rarity"]
        curAddonList = rarity["Addons"]
        
        for addon in curAddonList:
            newAddon = {
                "id": localAddonID,
                "globalID": globalAddonID,
                "addonIcon": GetAddonIcon(killerName, addon),
                "Name": addon,
                "Rarity": rarityIndex
            }

            killerData["Addons"].append(newAddon)
            globalAddonID += 1
            localAddonID += 1

        rarityIndex += 1
    
    finalFileObject.append(killerData)

json.dump(finalFileObject, newAddonFile, indent=4)

newAddonFile.close()
