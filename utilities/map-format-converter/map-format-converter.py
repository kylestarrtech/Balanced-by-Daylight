import json
import io

oldMapFile = open("OldMaps.json", "r")

oldMapData = json.load(oldMapFile)

oldMapFile.close()

newMapData = []

index = 0
for oldMap in oldMapData:
    newMap = {
        "ID": index,
        "Name": oldMap,
        "Realm": "N/A",
        "Type": 0,
        "Icon": "N/A",
        "ClockImage": "N/A"
    }
    newMapData.append(newMap)
    index += 1

newMapFile = open("NewMaps.json", "w")

json.dump(newMapData, newMapFile, indent=4)

newMapFile.close()

print("Conversion complete!")