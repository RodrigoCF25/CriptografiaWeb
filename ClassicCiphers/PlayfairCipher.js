
const Cipher = require('../Cipher.js');
const MatrixLib = require('../MatrixLib.js');
const {RemoveNotAlphabeticChars} = require('../TextLib.js');

class PlayfairCipher extends Cipher{

    constructor(){
        super();
        this.ALPHABET = [...'abcdefghijklmnñopqrstuvwxyz']
        this.ALPHABET = new Set(this.ALPHABET.filter((letter) => letter != 'j' && letter != 'ñ'));
        this.keyMatrix = [];
        this.lettersPositions = {};
    }

    #CreatetKeyMatrix(key){
        
        let keyCleaned = [];

        let keyUniqueChars = new Set();

        const keyLength = key.length

        for(let i = 0; i < keyLength; i++){
            if (!keyUniqueChars.has(key[i])){
                keyCleaned.push(key[i]);
                keyUniqueChars.add(key[i]);
            }
            else{
                keyCleaned.push('*');
            }

        }

        let alphabet = new Set(this.ALPHABET);

        keyUniqueChars.forEach((letter) => alphabet.delete(letter)); // Remove the letters of the key from the alphabet

        let remainingLetters = [...alphabet].sort();

        for(let i = 0; i < keyCleaned.length; i++){
            if(keyCleaned[i] == '*'){
                keyCleaned[i] = remainingLetters.pop();
            }
        }

        let keyMatrixUnidimensional = keyCleaned.concat(remainingLetters)

        let keyMatrix = [];

        for(let i = 0; i < 5; i++){
            keyMatrix.push(keyMatrixUnidimensional.slice(i*5,i*5+5));
        }

        return keyMatrix;

    }

    #GetLettersPositions(keyMatrix){
       
        let lettersPositions = {};
        for(let i = 0; i < 5; i++){
            for(let j = 0; j < 5; j++){
                lettersPositions[keyMatrix[i][j]] = {row: i, column: j};
            }
        }

        return lettersPositions;

    }

    PrepareText(text){

        text = RemoveNotAlphabeticChars(text);
        text = text.toLowerCase();
        text = text.split('');

        text = text.map((letter) =>{
            switch(letter){
                case 'j':
                    return 'i';
                case 'ñ':
                    return 'n';
                default:
                    return letter;
            }
        })

        return text;
    }

    ValidateKey(key){

        if(key.length == 0){
            throw new Error('The key is not valid because it does not contain any letter');
        }
        else if(key.length > 25){
            throw new Error('The key is not valid because it contains more than 25 letters');
        }
        
    }

    async Encrypt(text,key){
        this.keyMatrix = [];
        this.lettersPositions = {}

        const copyText = text.split('');
        text = this.PrepareText(text);
        key = this.PrepareText(key);

        try{
            this.ValidateKey(key);
        }catch(e){
            throw e;
        }

        let sizeOfBlock = this.CalculateSizeOfBlock(text);
        if(sizeOfBlock % 2 != 0){
            sizeOfBlock++;
        }

        this.keyMatrix = this.#CreatetKeyMatrix(key);

        this.lettersPositions = this.#GetLettersPositions(this.keyMatrix);



        let encryptedBlocks = [];

        for(let i = 0; i < text.length; i++){

            let block = text.splice(0,sizeOfBlock);

            encryptedBlocks.push(this.EncryptBlock(block));

        }

        let results = await Promise.all(encryptedBlocks);

        results = results.join('').split('');


        let encryptedText = copyText; //Points to the same array
        

        let counter = 0;
        for(let i = 0; i < copyText.length; i++){
            if(copyText[i].match(/[a-z]/i)){
                let letter = results[counter];
                counter++;
                if(copyText[i] == copyText[i].toUpperCase()){
                    letter = letter.toUpperCase();
                }
                encryptedText[i] = letter;
            }
        }

        if(counter < results.length){
            encryptedText.push(results.slice(counter).join(''));
        }
        

        return encryptedText.join('');
         
    }

   

    async EncryptBlock(text,key){

        if(text.length % 2 != 0){
            text.push('x');
        }

        const textLength = text.length;

        let encryptedBlock = [];

        for(let i = 0; i < textLength; i+=2){
            const letter1 = text[i];
            const letter2 = text[i+1];

            const position1 = this.lettersPositions[letter1];
            const position2 = this.lettersPositions[letter2];
            encryptedBlock.push(this.#EncryptPair(position1,position2));
        }
        
        return encryptedBlock.join('');
    }

    #EncryptPair(position1,position2){

        if(position1.row == position2.row){
            return this.#EncryptSameRow(position1,position2);
        }else if(position1.column == position2.column){
            return this.#EncryptSameColumn(position1,position2);
        }else{
            return this.#EncryptDifferentRowAndColumn(position1,position2);
        }
    }


    #EncryptSameRow(position1,position2){
        const newFirstLetter = this.keyMatrix[position1.row][(position1.column + 1) % 5];
        const newSecondLetter = this.keyMatrix[position2.row][(position2.column + 1) % 5];
        return `${newFirstLetter}${newSecondLetter}`;
    }


    #EncryptSameColumn(position1,position2){
        const newFirstLetter = this.keyMatrix[(position1.row + 1) % 5][position1.column];
        const newSecondLetter = this.keyMatrix[(position2.row + 1) % 5][position2.column];
        return `${newFirstLetter}${newSecondLetter}`;
    }


    #EncryptDifferentRowAndColumn(position1,position2){
        const newFirstLetter = this.keyMatrix[position1.row][position2.column];
        const newSecondLetter = this.keyMatrix[position2.row][position1.column];
        return `${newFirstLetter}${newSecondLetter}`;
    }


    async Decrypt(text,key){

        const copyText = text.split('');
        text = this.PrepareText(text);
        key = this.PrepareText(key);

        try{
            this.ValidateKey(key);
        }catch(e){
            throw e;
        }

        if(text.length % 2 != 0){
            throw new Error('The text to decrypt is not valid because it does not have an even number of letters');
        }


        let sizeOfBlock = this.CalculateSizeOfBlock(text);

        if(sizeOfBlock % 2 != 0){
            sizeOfBlock++;
        }

        this.keyMatrix = this.#CreatetKeyMatrix(key);

        this.lettersPositions = this.#GetLettersPositions(this.keyMatrix);


        let decryptedBlocks = [];

        for(let i = 0; i < text.length; i++){
                
            let block = text.splice(0,sizeOfBlock);

            decryptedBlocks.push(this.DecryptBlock(block));
    
        }
        
        let results = await Promise.all(decryptedBlocks);

        results = results.join('').split('');


        let decryptedText = copyText; //Points to the same array

        let counter = 0;
        for(let i = 0; i < copyText.length; i++){
            if(copyText[i].match(/[a-z]/i)){
                let letter = results[counter];
                counter++;
                if(copyText[i] == copyText[i].toUpperCase()){
                    letter = letter.toUpperCase();
                }
                decryptedText[i] = letter;
            }
        }

        if(counter < results.length){
            decryptedText.push(results.slice(counter).join(''));
        }

        return decryptedText.join('');
        


    }

    async DecryptBlock(text,key){

        const textLength = text.length;

        let decryptedBlock = [];

        for(let i = 0; i < textLength; i+=2){
            const letter1 = text[i];
            const letter2 = text[i+1];

            const position1 = this.lettersPositions[letter1];
            const position2 = this.lettersPositions[letter2];
            decryptedBlock.push(this.#DecryptPair(position1,position2));
        }

        return decryptedBlock.join('');
    }

    #DecryptPair(position1,position2){

        if(position1.row == position2.row){
            return this.#DecryptSameRow(position1,position2);
        }else if(position1.column == position2.column){
            return this.#DecryptSameColumn(position1,position2);
        }
        else{
            return this.#DecryptDifferentRowAndColumn(position1,position2);
        }
    }

    #DecryptSameRow(position1,position2){
        const newFirstLetter = this.keyMatrix[position1.row][(position1.column - 1 + 5) % 5];
        const newSecondLetter = this.keyMatrix[position2.row][(position2.column - 1 + 5) % 5];
        return `${newFirstLetter}${newSecondLetter}`;
    }

    #DecryptSameColumn(position1,position2){
        const newFirstLetter = this.keyMatrix[(position1.row - 1 + 5) % 5][position1.column];
        const newSecondLetter = this.keyMatrix[(position2.row - 1 + 5) % 5][position2.column];
        return `${newFirstLetter}${newSecondLetter}`;
    }

    #DecryptDifferentRowAndColumn(position1,position2){
        const newFirstLetter = this.keyMatrix[position1.row][position2.column];
        const newSecondLetter = this.keyMatrix[position2.row][position1.column];
        return `${newFirstLetter}${newSecondLetter}`;
    }



   
}


/*
(async () => {
    const cipher = new PlayfairCipher();
    const text = 'Springtrapisthebestanimatronic';
    let encrypted = await cipher.Encrypt(text,'Springtrap');
    console.log(encrypted);
    
    let decrypted = '';
    try{
    decrypted = await cipher.Decrypt(encrypted,'Springtrap');

    }catch(e){
        console.log(e.message);
    }
    
    console.log(decrypted);


})()
*/


module.exports = PlayfairCipher;