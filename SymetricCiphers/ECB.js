 
const {TextToBinary, BinaryToText, TextToHex, HexToText, BinaryToHex, XOR, HexToBinary} = require('../BinaryOperations');

const {RemoveExtraEmptySpaces} = require('../TextLib');

const {SymetricCipher, TypeOfInput} = require('./SymetricCipher');


class ECB extends SymetricCipher{

    constructor(){
        super();
        this.mustKeyLength = 64;
    }

    async Encrypt(input,key){

        key = this.PrepareKey(key);
        if(key.length !== this.mustKeyLength){
            throw new Error("Key must be 64 bits long");
        }

        input = this.PrepareInput(input);

        
        if (input.length % this.mustKeyLength != 0) {
            const paddingLength = this.mustKeyLength - (input.length % this.mustKeyLength);
            input = [...input, ...new Array(paddingLength).fill('0')];
        }
    


        let result = [];

        for (let i = 0; i < input.length; i += this.mustKeyLength) {
            let block = input.slice(i,i+this.mustKeyLength);
            block = XOR(block,key);
            result.push(...block);
        }


        return BinaryToHex(result.join(''),'');
        

        /*
        let sizeOfBlock = this.CalculateSizeOfBlock(input);

        if(sizeOfBlock % this.mustKeyLength != 0){
            sizeOfBlock += this.mustKeyLength - (sizeOfBlock % this.mustKeyLength);
        }

        let encryptedBlocks = [];
        for(let i = 0; i < input.length; i ++){
            let blocks = input.splice(0,sizeOfBlock);
            encryptedBlocks.push(this.EncryptBlock(blocks,key));
        }

        const results = await Promise.all(encryptedBlocks); 
        return BinaryToHex(results.join(''),'');
        */

    }


    async EncryptBlock(input,key){

        
        if (input.length % this.mustKeyLength != 0) {
            const paddingLength = this.mustKeyLength - (input.length % this.mustKeyLength);
            input = [...input, ...new Array(paddingLength).fill('0')];
        }

        let result = []


        for (let i = 0; i < input.length; i ++) {
            let block = input.splice(0,this.mustKeyLength);
            block = XOR(block,key);
            result.push(...block);
        }
        
        return result.join('');
        
    }

    async Decrypt(input,key){

        key = this.PrepareKey(key);
   

        if(key.length !== this.mustKeyLength){
            throw new Error("Key must be 64 bits long");
        }


        input = this.PrepareInput(input);

        
        let result = []

        for (let i = 0; i < input.length; i += this.mustKeyLength) {
            let block = input.slice(i,i+this.mustKeyLength);
            block = XOR(block,key);
            result.push(...block);
        }

        return BinaryToText(result.join(''));
        


        /*
        let sizeOfBlock = this.CalculateSizeOfBlock(input);


        if(sizeOfBlock % this.mustKeyLength != 0){
            sizeOfBlock += this.mustKeyLength - (sizeOfBlock % this.mustKeyLength);
        }

        let decryptedBlocks = [];
        for(let i = 0; i < input.length; i ++){
            let blocks = input.splice(0,sizeOfBlock);
            decryptedBlocks.push(this.DecryptBlock(blocks,key));
        }


        const results = await Promise.all(decryptedBlocks);


        return BinaryToText(results.join(''));
        */



    }

    async DecryptBlock(input,key){

        let result = [];

        for (let i = 0; i < input.length; i += this.mustKeyLength) {
            let block = input.slice(i,i+this.mustKeyLength);
            block = XOR(block,key);   
            result.push(...block);
        }

        return result.join('');
    }

}


module.exports = ECB
