const Cipher = require('../Cipher');

const {TextToBinary, BinaryToText, TextToHex, HexToText, HexToBinary} = require('../BinaryOperations');

const {RemoveExtraEmptySpaces} = require('../TextLib');

const TypeOfInput = {
    TEXT: 0,
    BINARY: 1,
    HEX: 2,
} 

class SymetricCipher extends Cipher{

    constructor(){
        super();
        
        this.TypeOfInput = {
            TEXT: 0,
            BINARY: 1,
            HEX: 2,
        }
    }


    IdentifyFormat(input){
        if(input.match(/^[0-1]+$/)){
            return this.TypeOfInput.BINARY;
        }else if(input.match(/^[0-9A-Fa-f]+$/)){
            return this.TypeOfInput.HEX;
        }else{
            return this.TypeOfInput.TEXT;
        }
    }


    PrepareInput(input){

        input = RemoveExtraEmptySpaces(input);
        const typeOfInput = this.IdentifyFormat(input);

        switch(typeOfInput){
            case TypeOfInput.TEXT:{
                return [...TextToBinary(input, '')];

            }
            case TypeOfInput.HEX:{
                
                return [...HexToBinary(input,'')]
                
            }
            case TypeOfInput.BINARY:{
                return [...input];
            }
        }

    }


    PrepareKey(key){

        key = RemoveExtraEmptySpaces(key);
        const typeOfInput = this.IdentifyFormat(key);

        switch(typeOfInput){
            case TypeOfInput.TEXT:{
                return [...TextToBinary(key, '')];

            }
            case TypeOfInput.HEX:{
                let x = [...HexToBinary(key,'')]
                return x;
            }
            case TypeOfInput.BINARY:{
                return [...key];
            }
       }


    }

    async Encrypt(input,key){
        
    }

    async EncryptBlock(input,key){
        
    }

    async Decrypt(input,key){

    }

    async DecryptBlock(input,key){
    }


}


module.exports = {SymetricCipher,TypeOfInput};