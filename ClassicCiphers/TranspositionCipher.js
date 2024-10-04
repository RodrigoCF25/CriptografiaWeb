const Cipher = require('../Cipher.js');




class TranspositionCipher extends Cipher{

   
    ValidateKey(key){
        let uniqueKeyElements = key.reduce((acc,element) => {
            if(!acc.includes(element)){
                acc.push(element);
            }
            return acc;
        },[]);

        if (uniqueKeyElements.length !== key.length) {
            throw new Error('The key must have unique elements');
        }

        let isKeyValid = key.every((element) => {
            return element >= 0 && element < key.length;
        });

        if (!isKeyValid) {
            throw new Error('The key must have elements between 0 and the length of the key');
        }
    }

    async Encrypt(text,key){

        text = this.PrepareText(text);
        
        try {
            this.ValidateKey(key);
        }
        catch (error) {
            throw error;
        }

        let textLength = text.length;
        let remainder = textLength % key.length;


        if (remainder !== 0) {
            let emptySpaces = key.length - remainder;
            let trashArray = new Array(emptySpaces).fill('x');
            text.push(...trashArray);
        }


        const result = await this.EncryptBlock(text,key);

        return result;

    }

    EncryptBlock(text,key){

        for (let i = 0; i<text.length; i += key.length) {
            let block = text.slice(i,i+key.length);
            for (let j = 0; j < key.length; j++) {
                block[key[j]] = text[i+j];
            }
            text.splice(i,key.length,...block);
        }

        return text.join('');
        
    }


    async Decrypt(text,key){

        text = [...text];

        try {
            this.ValidateKey(key);
        }
        catch (error) {
            throw error;
        }
        
        let textLength = text.length;
        let remainder = textLength % key.length;

        if (remainder !== 0) {
            throw new Error('The text cannot be decrypted with the given key');
        }

        const result = await this.DecryptBlock(text,key);

        return result;
    }

    DecryptBlock(text,key){

        for (let i = 0; i<text.length; i += key.length) {
            let block = text.slice(i,i+key.length);
            for (let j = 0; j < key.length; j++) {
                block[j] = text[i+key[j]];
            }
            text.splice(i,key.length,...block);
        }

        return text.join('');

    }
}

//CommonJS
module.exports = TranspositionCipher;
