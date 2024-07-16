/*
Name:
    checker-modal.js
Purpose:
    This file is designed for the purpose of handling any modal displays in the checker page.
*/

/**
 * Displays the credits modal.
 */
function DisplayCredits() {
    GenerateAlertModal(
        "Credits/Contributors",
        "Many people have made great contributions to Balanced by Daylight. This is one way to spotlight them.<br><br><hr>" +
        "<b>SHADERS (Kyle)</b> - Started the project, and leads the development of Balanced by Daylight.<br><hr>" +
        "<b>Floliroy</b> - Assisted heavily in improvements to Perk search, import/export, added drag/drop, and SO much more...<br><hr>" +
        "<b>S1mmyy</b> - Fixed the drag/drop functionality on Firefox and made the system much easier to work with.<br><hr>" +
        "<b>Vivian Sanchez</b> - Began the work on the mobile UI for Balanced by Daylight.<br><hr>" +
        "<b>WheatDraws</b> - Created the Balanced by Daylight logo.<br><hr>" +
        "<b>MegaDirtPotato</b> - Greatly assisted in troubleshooting and diagnosing bugs with the project.<br><hr>" +
        "<br>" + 
        "This project is open source, and contributions are welcome. If you would like to contribute, please visit the <a target='_blank' href='https://github.com/kylestarrtech/DBD-Balance-Checker'>GitHub</a>."
    );
}

/**
 * Checks whether this balancing profile has global notes and if the app is to show notes on launch it will call GenerateNotesModal() and return.
 */
function CheckGlobalBalanceNotes() {
    if (!showNotesOnLaunch) { return; }
    if (currentBalancing == null) { return; }

    if (currentBalancing["GlobalNotes"] == undefined) { return; }
    if (currentBalancing["GlobalNotes"].length == 0) { return; }

    GenerateNotesModal();
    return;
}

/**
 * Ensures the selected killer and current balancing is valid, then calls GenerateNotesModal() if the associated killer selected has notes on their override.
 */
function CheckIndividualKillerNotes() {
    if (!showNotesOnLaunch) { return; }
    if (currentBalancing == null) { return; }
    if (currentBalancing["KillerOverride"] == undefined) { return; }
    if (currentBalancing["KillerOverride"][selectedKiller] == undefined) { return; }
    if (currentBalancing["KillerOverride"][selectedKiller]["KillerNotes"] == undefined) { return; }

    if (currentBalancing["KillerOverride"][selectedKiller]["KillerNotes"].length == 0) { return; }

    GenerateNotesModal();
}

/**
 * Generates the list of maps for the selected killer override and displays them in the alert modal.
 */
function GenerateMapModal() {
    // Get maps for the selected killer
    let maps = currentBalancing["KillerOverride"][selectedKiller]["Map"];

    let mapNames = [];
    for (var i = 0; i < maps.length; i++) {
        let map = GetMapByID(maps[i]);

        let mapName = `${map["Realm"]} - ${map["Name"]}`;

        mapNames.push(mapName);
    }

    // Create the modal
    GenerateAlertModal(
        "Map Information",
        `When ${selectedRole == 0 ? "playing against" : "playing as"} <b>${Killers[selectedKiller].Name}</b>, the following maps are required:<br><br><hr><b>${mapNames.join("</b>,<br> <b>")}</b><br><hr><br>Note that certain maps may have different conditions, consult official balancing for more information.`
    );
}

/**
 * Builds a note string from the global notes and killer override notes, then displays them in the alert modal.
 */
function GenerateNotesModal() {
    // Get global notes
    let globalNotes = currentBalancing["GlobalNotes"] == undefined ?
        "No global notes for this balancing profile." :
        currentBalancing["GlobalNotes"] == "" ?
            "No global notes for this balancing profile." :
            currentBalancing["GlobalNotes"];

    // Get notes for the selected killer
    let killerNotesBase = currentBalancing["KillerOverride"][selectedKiller]["KillerNotes"];

    let killerNotes = killerNotesBase == undefined ?
        "No special notes for this killer." :
        killerNotesBase == "" ?
            "No special notes for this killer." :
            killerNotesBase;

    // Remove any HTML from the notes
    globalNotes = globalNotes.replace(/<[^>]*>?/gm, '');
    killerNotes = killerNotes.replace(/<[^>]*>?/gm, '');

    let noteString = `The selected balancing profile has the following special notes:<br>`;
    noteString += `<br><hr><b>Global Notes:</b><br>${globalNotes}<br><hr><br>`;
    noteString += `<hr><b>Killer Notes:</b><br>${killerNotes}<br><hr>`;

    // Create the modal
    GenerateAlertModal(
        "Notes",
        noteString
    );
}