

function RemoveExtraEmptySpaces(string){
    return string.replace(/\s+/g, ' ').trim();
}

function isAlphabetic(char) {
    return /^[a-zA-Z]$/.test(char);
}

module.exports = {
    RemoveExtraEmptySpaces,
    isAlphabetic
}