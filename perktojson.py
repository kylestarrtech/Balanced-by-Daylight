# Open the file "dbdperks.csv" and separate into an array

import csv
import json

# Create an empty list
perks = []

perkFiles = ["dbdsrvperks.csv", "dbdklrperks.csv"]

i = 0
for perkFile in perkFiles:
    # Open the file
    with open(perkFile, newline='') as csvfile:
        # Read the file into a list
        reader = csv.reader(csvfile, delimiter=',', quotechar='|')
        # Create an empty list
        # Since each perk is in the columns of the CSV file, we need to loop through those
        for row in reader:
            # Add the perk to the list
            perkObj = {
                "name": row[0],
                "isSurv": i == 0
            }
            perks.append(perkObj)

    i = i + 1

# Create a new list to hold the JSON objects
perksJSON = []

i = 0;
# Loop through the list of perks
for perk in perks:
    # Create a new JSON object
    perkJSON = {}

    # Add the perk ID to the JSON object
    perkJSON['id'] = i

    # Add the perk name to the JSON object
    perkJSON['name'] = perk["name"]

    # Get the image URL to the perk.
    # The image url starts with "public/Perks/Survivors/" and then is the name of the perk with "'" replaced with "_" and no characters that aren't letters or numbers
    # The image url ends with ".png"
    perkFileName = perk["name"].replace("'", "_").replace("-", " ").replace(":", "").replace("!", "").replace("&", "And")
    
    # Convert perkFileName to title case and add file extension
    perkFileName = perkFileName.title() + ".png"

    # Add the image URL to the JSON object
    perkJSON["icon"] = "public/Perks/Survivors/" + perkFileName

    perkJSON['exhaustion'] = False
    perkJSON['tags'] = []
    perkJSON['character'] = ""
    perkJSON['survivorPerk'] = perk["isSurv"]


    # Add the JSON object to an array
    perksJSON.append(perkJSON)
    i = i + 1

# Open a new file
with open('dbdperks.json', 'w') as outfile:
    # Write the JSON array to the file
    json.dump(perksJSON, outfile, indent=4)