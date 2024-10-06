 
const {TextToBinary, BinaryToText, TextToHex, HexToText, BinaryToHex, XOR, HexToBinary} = require('../BinaryOperations');

const {RemoveExtraEmptySpaces} = require('../TextLib');

const {SymetricCipher, TypeOfInput} = require('./SymetricCipher');


class CBC extends SymetricCipher{

    constructor(){
        super();
        this.mustKeyLength = 64;
    }

    async Encrypt(input,key,iv){

        key = this.PrepareKey(key);
        if(key.length !== this.mustKeyLength){
            throw new Error("Key must be 64 bits long");
        }

        iv = this.PrepareKey(iv);
        if(iv.length !== this.mustKeyLength){
            throw new Error("IV must be 64 bits long");
        }

        input = this.PrepareInput(input);

        
        if (input.length % this.mustKeyLength != 0) {
            const paddingLength = this.mustKeyLength - (input.length % this.mustKeyLength);
            input = [...input, ...new Array(paddingLength).fill('0')];
        }
    


        let result = [];

        let block = [];
        let previousBlock = iv;
        for (let i = 0; i < input.length; i += this.mustKeyLength) {
            block = input.slice(i,i+this.mustKeyLength);
            block = this.EncryptBlock(block,key,previousBlock);
            previousBlock = [...block];
            result.push(...block);
        }


        return BinaryToHex(result.join(''),'');
        
    }

    EncryptBlock(text,key,iv){
        let xoredBlock = [...XOR(text,iv)];
        let cipherBlock = [...XOR(xoredBlock,key)];
        return cipherBlock;
    }


    

    async Decrypt(input,key,iv){

        key = this.PrepareKey(key);


        if(key.length !== this.mustKeyLength){
            throw new Error("Key must be 64 bits long");
        }

        iv = this.PrepareKey(iv);

        if(iv.length !== this.mustKeyLength){
            throw new Error("IV must be 64 bits long");
        }


        input = this.PrepareInput(input);

        
        let result = []

        let block = [];
        let previousBlock = iv;
        for (let i = 0; i < input.length; i += this.mustKeyLength) {
            block = input.slice(i,i+this.mustKeyLength);
            let decryptedBlock = this.DecryptBlock(block,key,previousBlock);
            previousBlock = [...block];
            result.push(...decryptedBlock);
        }
        

        return BinaryToText(result.join(''));
    }


    DecryptBlock(text,key,iv){
        let decryptedBlock = [...XOR(text,key)];
        let xoredBlock = [...XOR(decryptedBlock,iv)];
        return xoredBlock;
    }

   

}


module.exports = CBC
