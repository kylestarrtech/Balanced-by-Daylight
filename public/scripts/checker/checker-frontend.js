/*
Name:
    checker-frontend.js
Purpose:
    This file is designed for the purpose of handling all frontend changes and housing those related methods.
*/

/**
 * Updates the selected role header text depending on whether Survivor or Killer builds are selected.
 */
function UpdateRoleSelectionHeaderUI() {
    const header = document.getElementById("selected-role-header");
    header.innerText = selectedRole == 0 ? "Survivor Builds" : "Killer Build";
}

/**
 * Responsible for showing/hiding the builds container depending on the role selected and triggering their associated update methods.
 */
function UpdatePerkUI() {
    if (selectedRole == 0) {
        document.getElementById("survivor-builds-container").classList.remove("hide-component");
        document.getElementById("killer-builds-container").classList.add("hide-component");
        
        UpdateSurvivorPerkUI();
    } else {
        document.getElementById("killer-builds-container").classList.remove("hide-component");
        document.getElementById("survivor-builds-container").classList.add("hide-component");

        UpdateKillerPerkUI();
    }
}