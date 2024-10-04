const {RemoveExtraEmptySpaces} = require('./TextLib')

function AND(a, b) {
    if (a === "1" && b === "1") {
        return "1";
    }
    return "0";
}


function OR(a, b) {
    if (a === "1" || b === "1") {
        return "1";
    }
    return "0";
}


function XOR(a, b) {
    if (a !== b) {
        return "1";
    }
    return "0";
}

function NOT(a) {
    if (a === "1") {
        return "0";
    }
    return "1";
}


function NAND(a, b) {
    return NOT(AND(a, b));
}


function NOR(a, b) {
    return NOT(OR(a, b));
}


function XNOR(a, b) {
    return NOT(XOR(a, b));
}


function TextToBinary(text, spacer = ' '){
    text = RemoveExtraEmptySpaces(text);
    return text.split('').map((char) => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }
    ).join(spacer);
}

function TextToHex(text, spacer = ' '){
    text = RemoveExtraEmptySpaces(text);
    return text.split('').map((char) => {
        return char.charCodeAt(0).toString(16);
    }).join(spacer);
}

function BinaryToText(binary){
    
    const binarySeparator = binary.includes(' ') ? ' ' : '';
    if (binarySeparator === ''){
        if (binary.length % 8 !== 0){
            throw new Error('The binary string is not valid');
        }

        const text = new Array(binary.length / 8).fill(0).map((_, index) => {
            return String.fromCharCode(parseInt(binary.slice(index * 8, (index + 1) * 8), 2));
        }).join('');

        return text;
    }
    binary = RemoveExtraEmptySpaces(binary);
    return binary.split(binarySeparator).map((char) => {
        return String.fromCharCode(parseInt(char, 2));
    }).join('');
}

function HexToText(hex){

    const hexSeparator = hex.includes(' ') ? ' ' : '';
    if (hexSeparator === ''){
        if (hex.length % 2 !== 0){
            throw new Error('The hex string is not valid');
        }

        const text = new Array(hex.length / 2).fill(0).map((_, index) => {
            return String.fromCharCode(parseInt(hex.slice(index * 2, (index + 1) * 2), 16));
        }).join('');

        return text;
    }
    binary = RemoveExtraEmptySpaces(binary);
    return hex.split(hexSeparator).map((char) => {
        return String.fromCharCode(parseInt(char, 16));
    }).join('');
}


function BinaryToHex(binary, spacer = ' '){
    const binarySeparator = binary.includes(' ') ? ' ' : '';
    
    if (binarySeparator === ''){
        if (binary.length % 8 !== 0){
            throw new Error('The binary string is not valid');
        }

        const hex = new Array(binary.length / 8).fill(0).map((_, index) => {
            return parseInt(binary.slice(index * 8, (index + 1) * 8), 2).toString(16);
        }).join('');

        return hex;
    }

    binary = RemoveExtraEmptySpaces(binary);
    return binary.split(binarySeparator).map((char) => {
        return parseInt(char, 2).toString(16);
    }).join(spacer);
}


function HexToBinary(hex, spacer = ' '){
    const hexSeparator = hex.includes(' ') ? ' ' : '';
    
    if (hexSeparator === ''){
        if (hex.length % 2 !== 0){
            throw new Error('The hex string is not valid');
        }

        const binary = new Array(hex.length / 2).fill(0).map((_, index) => {
            return parseInt(hex.slice(index * 2, (index + 1) * 2), 16).toString(2).padStart(8, '0');
        }).join('');

        return binary;
    }

    hex = RemoveExtraEmptySpaces(hex);
    return hex.split(hexSeparator).map((char) => {
        return parseInt(char, 16).toString(2).padStart(8, '0');
    }).join(spacer);
}