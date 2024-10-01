
const { RemoveExtraEmptySpaces } = require('./TextLib.js');

class Cipher{

    CalculateSizeOfBlock(text){
        let textLength = text.length;
        let sizeOfBlock =  Math.ceil(textLength/Math.log10(text.length));
        return sizeOfBlock;
    }

    PrepareText(text){
        text = RemoveExtraEmptySpaces(text);
        text = text.split('');
        return text;
    }

    async Encrypt(text,key){

    }

    async EncryptBlock(text,key){
        
    }

    async Decrypt(text,key){

    }

    async DecryptBlock(text,key){
    }
}

//CommonJS
module.exports = Cipher;