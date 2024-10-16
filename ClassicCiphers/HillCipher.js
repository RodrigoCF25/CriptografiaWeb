const Cipher = require('../Cipher.js');
const MatrixLib = require('../MatrixLib.js');
const {RemoveNotAlphabeticChars} = require('../TextLib.js');
const  {GetMultiplicativeInverse, Mod} = require('../ModLib.js');

class HillCipher extends Cipher{

    constructor(){
        super();
        this.ALPHABET = [...'abcdefghijklmnopqrstuvwxyz'];
        this.ALPHABETLength = this.ALPHABET.length;
    }

    #ValidateKey(key){

        const determinant = Mod(MatrixLib.Determinant(key),this.ALPHABETLength);
        if (determinant == 0 || !Number.isInteger(determinant)) {
            throw new Error('The key matrix is not invertible because the determinant is 0 or is not an integer');
        }

        const multiplicativeInverse = GetMultiplicativeInverse(determinant,this.ALPHABETLength);

        if(multiplicativeInverse == 0){
            throw new Error('The key matrix is not invertible because the determinant is not invertible');
        }
    }


    PrepareText(text){

        text = RemoveNotAlphabeticChars(text);
        text = text.toLowerCase();
        text = text.split('');

        text = text.map((letter) => letter === 'ñ' ? 'n' : letter);
        return text;
    }


    async Encrypt(text,key){

        try{
            this.#ValidateKey(key);
        }
        catch(e){
            throw e; //Key cannot be inverted
        }

        const copyText = text;

        text = this.PrepareText(text);
        
        let sizeOfBlock = this.CalculateSizeOfBlock(text);

        //Adjust sizeOfBlock to be a multiple of key.length

        sizeOfBlock = sizeOfBlock + (key.length - sizeOfBlock % key.length);


        let encryptedBlocks = [];

        for (let i = 0; i < text.length; i++) {
            let block = text.splice(0,sizeOfBlock)
            encryptedBlocks.push(this.#EncryptBlock(block,key));
        }

        let results = await Promise.all(encryptedBlocks);

        results = results.join('').split('');

        let encryptedText = [];

        for (let i = 0; i < copyText.length; i++) {
            if (this.ALPHABET.includes(copyText[i].toLowerCase())) {
                let letter = results.shift();
                if (copyText[i] == copyText[i].toUpperCase()) {
                    letter = letter.toUpperCase();
                }
                encryptedText.push(letter);
            } else {
                encryptedText.push(copyText[i]);
            }
        }

        if(results.length > 0){
            encryptedText.push(results.join(''));
        }


        return encryptedText.join('');

    }

    async #EncryptBlock(text,key){

        const keyLength = key.length;

        if(text.length %keyLength != 0){
            const difference = keyLength - text.length % keyLength;
            const padding = Array(difference).fill('x');
            text = text.concat(padding);
        }

        const textLength = text.length;

        let encryptedBlock = new Array(textLength).fill(0);

        for (let i = 0; i < textLength; i += keyLength) {
            let block = text.slice(i,i+keyLength);
            block = this.#EncryptP(block,key);
            encryptedBlock.splice(i,keyLength,...block);
        }

        return encryptedBlock.join('');

        
    }


    #EncryptP(p,key){

        p = p.map((char) => this.ALPHABET.indexOf(char));

        let result = MatrixLib.Multiply([p],key)[0];

        result = result.map((number) => this.ALPHABET[Mod(number,this.ALPHABETLength)]);

        return result.join('');
        

    }


    #GetKeyInverse(key){

        
        let adjoint = MatrixLib.Adjoint(key);
        
        let determinant = MatrixLib.Determinant(key);


        determinant = Mod(determinant,this.ALPHABETLength);

        const determinantModularInverse = GetMultiplicativeInverse(determinant,this.ALPHABETLength);

        let keyInverse = adjoint.map((row) => (row.map((number) => 
            Mod(number * determinantModularInverse,this.ALPHABETLength)))
        );

        return keyInverse;

    }

    async Decrypt(text,key){

        try{
            this.#ValidateKey(key);
        }
        catch(e){
            throw e; //Key cannot be inverted
        }

        const copyText = text;

        text = this.PrepareText(text);

        let sizeOfBlock = this.CalculateSizeOfBlock(text);

        //Adjust sizeOfBlock to be a multiple of key.length

        sizeOfBlock = sizeOfBlock + (key.length - sizeOfBlock % key.length);

        let decryptedBlocks = [];

        const determinant = MatrixLib.Determinant(key);

        if (determinant == 0 || !Number.isInteger(determinant)) {
            throw new Error('The key matrix is not invertible');
        }

        let keyInverse = this.#GetKeyInverse(key);



        for (let i = 0; i < text.length; i++) {
            let block = text.splice(0,sizeOfBlock)
            decryptedBlocks.push(this.#DecryptBlock(block,keyInverse));
        }

        let results = await Promise.all(decryptedBlocks);

        results = results.join('').split('');

        let decryptedText = [];

        for (let i = 0; i < copyText.length; i++) {
            if (this.ALPHABET.includes(copyText[i].toLowerCase())) {
                let letter = results.shift();
                if (copyText[i] == copyText[i].toUpperCase()) {
                    letter = letter.toUpperCase();
                }
                decryptedText.push(letter);
            } else {
                decryptedText.push(copyText[i]);
            }
        }

        if(results.length > 0){
            decryptedText.push(results.join(''));
        }

        return decryptedText.join('');

    }

    async #DecryptBlock(text,key){

        const keyLength = key.length;

        let difference = 0;
        
        if(text.length %keyLength != 0){
            difference = keyLength - text.length % keyLength;
            const padding = Array(difference).fill('x');
            text = text.concat(padding);
        }

        const textLength = text.length;

        let decryptedBlock = new Array(textLength).fill(0);

        for (let i = 0; i < textLength; i += keyLength) {
            let block = text.slice(i,i+keyLength);
            block = this.#DecryptP(block,key);
            decryptedBlock.splice(i,keyLength,...block);
        }

        if(difference != 0){
            decryptedBlock = decryptedBlock.slice(0,-difference);
        }
        

        return decryptedBlock.join('');

    }

    #DecryptP(p,key){

        p = p.map((char) => this.ALPHABET.indexOf(char));

        let result = MatrixLib.Multiply([p],key)[0];

        result = result.map((number) => this.ALPHABET[(number + this.ALPHABETLength) % this.ALPHABETLength]);

        return result.join('');

    }

}

module.exports = HillCipher;