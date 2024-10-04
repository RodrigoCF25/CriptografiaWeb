
const Cipher = require('../Cipher');

const {isAlphabetic } = require('../TextLib');


class Vigenere extends Cipher{

    ValidateKey(key){
        let isKeyValid = key.every((element) => {
            if(isAlphabetic(element)){
                return true;
            }
            return false;
        });

        if (!isKeyValid) {
            throw new Error('The key must be a string with only alphabetic characters');
        }
    }
    

    CalculateSizeOfBlock(text,key){
        let textLength = text.length;

        let numberOfBlocks = Math.ceil(textLength / key.length);

        let sizeOfBlocks = Math.ceil(textLength / numberOfBlocks);

        let remainder = sizeOfBlocks % numberOfBlocks;


        if (remainder != 0){
            sizeOfBlocks += remainder;
        }

        return sizeOfBlocks;
    }

    
    async Encrypt(text,key){

        text = this.PrepareText(text);

        key = key.toLowerCase();
        key = [...key];

        try {
            this.ValidateKey(key);
        }
        catch(error){
            throw error;
        }


        key = key.map((element) => {
            return element.charCodeAt(0) - 97;
        });


        let sizeOfBlocks = this.CalculateSizeOfBlock(text,key);

        let encryptedBlocks = [];

        for (let i = 0; i < text.length; i += sizeOfBlocks) {

            let block = text.slice(i,i+sizeOfBlocks);
            encryptedBlocks.push(this.EncryptBlock(block,key));
        }

        const results = await Promise.all(encryptedBlocks);

        return results.join('');
    }

    async EncryptBlock(text,key){

        for (let i = 0; i<text.length; i += key.length) {
            let block = text.slice(i,i+key.length);
            for (let j = 0; j < key.length; j++) {
                if (!isAlphabetic(block[j])) {
                    continue;
                }
                let result = block[j].charCodeAt(0);
                if(result >= 65 && result <= 90){
                    result = (result - 65 + key[j]) % 26 + 65;
                }
                else if(result >= 97 && result <= 122){
                    result = (result - 97 + key[j]) % 26 + 97;
                }
                block[j] = String.fromCharCode(result);
            }
            text.splice(i,key.length,...block);
        }

        return text.join('');
        
    }

    async Decrypt(text,key){

        text = this.PrepareText(text);

        key = [...key];

        try {
            this.ValidateKey(key);
        }
        catch(error){
            throw error;
        }


        key = key.map((element) => {
            element = element.toLowerCase();
            return element.charCodeAt(0) - 97;
        });


        let sizeOfBlocks = this.CalculateSizeOfBlock(text,key);

        let decryptedBlocks = [];

        for (let i = 0; i < text.length; i += sizeOfBlocks) {

            let block = text.slice(i,i+sizeOfBlocks);
            decryptedBlocks.push(this.DecryptBlock(block,key));
        }

        const results = await Promise.all(decryptedBlocks);

        return results.join('');

    }

    async DecryptBlock(text,key){

        for (let i = 0; i<text.length; i += key.length) {
            let block = text.slice(i,i+key.length);
            for (let j = 0; j < key.length; j++) {
                if (!isAlphabetic(block[j])) {
                    continue;
                }
                let result = block[j].charCodeAt(0);
                if(result >= 65 && result <= 90){
                    result = (result - 65 - key[j] + 26) % 26 + 65;
                }
                else if(result >= 97 && result <= 122){
                    result = (result - 97 - key[j] + 26) % 26 + 97;
                }
                block[j] = String.fromCharCode(result);
            }
            text.splice(i,key.length,...block);
        }

        return text.join('');

    }
}

module.exports = Vigenere;