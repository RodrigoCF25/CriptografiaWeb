const {RemoveExtraEmptySpaces} = require('./TextLib')

function _AND(a, b) {
    if (a === "1" && b === "1") {
        return "1";
    }
    return "0";
}

function AND(a, b) {
   return a.map((char, index) => {
         return _AND(char,b[index]);
    }).join('');
}


function _OR(a, b) {
    if (a === "1" || b === "1") {
        return "1";
    }
    return "0";
}

function OR(a, b) {
    return a.map((char, index) => {
        return _OR(char,b[index]);
    }).join('');
}



function _XOR(a, b) {
    if (a !== b) {
        return "1";
    }
    return "0";
}

function XOR(a, b) {
    return a.map((char, index) => {
        return _XOR(char,b[index]);
    }).join('');
}

function _NOT(a) {
    if (a === "1") {
        return "0";
    }
    return "1";
}

function NOT(a) {
    return a.map((char) => {
        return _NOT(char);
    }).join('');
}



function _NAND(a, b) {
    return NOT(AND(a, b));
}

function NAND(a, b) {
    return NOT(AND(a, b));
}




function _NOR(a, b) {
    return NOT(OR(a, b));
}

function NOR(a, b) {
    return NOT(OR(a, b));
}


function _XNOR(a, b) {
    return NOT(XOR(a, b));
}


function XNOR(a, b) {
    return NOT(XOR(a, b));
}

function TextToBinary(text) {
    return text.split('').map((char) => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
}


function TextToHex(text) {
    return text.split('').map((char) => {
        return char.charCodeAt(0).toString(16).padStart(2, '0');
    }).join('');
}

function BinaryToText(binary) {
    
    let binaryLength = binary.length;

    
    let text = new Array(binaryLength/8).fill(0)
    let index = 0;
    for(let i = 0; i < binaryLength; i+=8){
        index = i/8;
        text[index] = String.fromCharCode(parseInt(binary.slice(i,i+8),2));
    }

    return text.join('');
}


function HexToText(hex) {
    let hexLength = hex.length;
    
    let text = new Array(hexLength/2).fill(0)
    let index = 0;

    for(let i = 0; i < hexLength; i+=2){
        index = i/2;
        text[index] = String.fromCharCode(parseInt(hex.slice(i,i+2),16));
    }

    return text.join('');
}


function BinaryToHex(binary) {

    let binaryLength = binary.length;
    
    let hex = new Array(binaryLength/4).fill(0)

    let index = 0;
    for(let i = 0; i < binaryLength; i+=4){
        index = i/4;
        hex[index] = parseInt(binary.slice(i,i+4),2).toString(16);
    }

    return hex.join('');
}


function HexToBinary(hex) {
    let hexLength = hex.length;
    
    let binary = new Array(hexLength*4).fill(0)

    for(let i = 0; i < hexLength; i++){
        binary.splice(i*4,4,...parseInt(hex[i],16).toString(2).padStart(4,'0')).join('');
    }

    return binary.join('');
}



module.exports = {
    AND,
    OR,
    XOR,
    NOT,
    NAND,
    NOR,
    XNOR,
    TextToBinary,
    TextToHex,
    BinaryToText,
    HexToText,
    BinaryToHex,
    HexToBinary
}



let text = "h"


