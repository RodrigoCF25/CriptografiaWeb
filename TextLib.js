

function RemoveExtraEmptySpaces(string){
    return string.replace(/\s+/g, ' ').trim();
}

function isAlphabetic(char) {
    return /^[a-zA-ZñÑ]$/.test(char);
}

function RemoveNotAlphabeticChars(string){
    return string.replace(/[^a-zA-ZñÑ]/g, '');
}







module.exports = {
    RemoveExtraEmptySpaces,
    isAlphabetic,
    RemoveNotAlphabeticChars
}


