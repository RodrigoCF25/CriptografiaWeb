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

        text = this.PrepareText(text);
        
        let sizeOfBlock = this.CalculateSizeOfBlock(text);

        //Adjust sizeOfBlock to be a multiple of key.length

        sizeOfBlock = sizeOfBlock + (key.length - sizeOfBlock % key.length);


        let encryptedBlocks = [];

        for (let i = 0; i < text.length; i++) {
            let block = text.splice(0,sizeOfBlock)
            encryptedBlocks.push(this.#EncryptBlock(block,key));
        }

        const results = await Promise.all(encryptedBlocks);
        return results.join('');

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

        const results = await Promise.all(decryptedBlocks);
        return results.join('');

    }

    async #DecryptBlock(text,key){

        const keyLength = key.length;

        if(text.length %keyLength != 0){
            throw new Error('The text is not valid because the size of the block is not a multiple of the key length');
        }

        const textLength = text.length;

        let decryptedBlock = new Array(textLength).fill(0);

        for (let i = 0; i < textLength; i += keyLength) {
            let block = text.slice(i,i+keyLength);
            block = this.#DecryptP(block,key);
            decryptedBlock.splice(i,keyLength,...block);
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