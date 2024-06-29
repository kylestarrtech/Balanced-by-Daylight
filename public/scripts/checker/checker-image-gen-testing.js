perksWithErrors = []
currentIndex = 0;

function TestSurvImageGenPerks(startIndex = -1) {
    if (startIndex < 0) {
        startIndex = currentIndex;
    }

    SurvivorPerks = [
        [GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++)],
        [GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++)],
        [GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++)],
        [GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++), GetPerkById(startIndex++)]
    ]

    GenerateImageFromButtonPress();

    currentIndex = startIndex;
}