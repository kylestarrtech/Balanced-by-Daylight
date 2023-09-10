# Get every file in the directory
# Loop through the files
# Convert the file name to title case
# Rename the file

import os

perkDirs = ["public/Perks/Survivors", "public/Perks/Killers"]

for perkDir in perkDirs:
# Get every file in the directory
    for filename in os.listdir(perkDir):
        # Split the file name by .
        filenameSplit = filename.split(".")

        # Convert the first part of the file name to title case
        newFilename = filenameSplit[0].title()

        # Convert the extension to lowercase
        filenameSplit[1] = filenameSplit[1].lower()

        # Add the file extension back to the file name
        newFilename = newFilename + "." + filenameSplit[1]

        # Rename the file
        os.rename(perkDir + "/" + filename, perkDir + "/" + newFilename)