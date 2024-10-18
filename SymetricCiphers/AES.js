const { dirname } = require('path');
const {TextToBinary, BinaryToText, TextToHex, HexToText, BinaryToHex, XOR, HexToBinary} = require('../BinaryOperations');

const {SymetricCipher} = require('./SymetricCipher');

const fs = require('fs');

const irreduciblePolynomial = ["1","0","0","0","1","1","0","1","1"];

const irreduciblePolynomialUsefulBits = ["0","0","0","1","1","0","1","1"];

function Add(a,b){
    return XOR(a,b);
}

function MultiplyByX(array){
    const doesItStartWithOne = array[0] === "1";
    let copy = [...array];
    copy.shift();
    copy.push("0");
    if(doesItStartWithOne){
        copy = XOR(copy,irreduciblePolynomialUsefulBits).split('');
    }
    return copy;
}

function Multiply(a,b){
    
    let dictionary = {};

    let copyA = [...a];

    dictionary[0] = copyA;

    b = [...b];

    if (copyA.every(bit => bit === "0") || b.every(bit => bit === "0")){
        return new Array(8).fill("0");
    }

    // Create a dictionary with all the possible values of a * x^i
    for(let i = 1; i < a.length; i++){
        copyA = MultiplyByX(copyA);
        dictionary[i] = copyA;
    }

    //Just get the bits that are on
    const bitsOn = b.reduce((acc,bit,index) => {
        if(bit === "1"){
            acc.push( 8 - 1 - index);
        }
        return acc;
    },[]);

    //Get the result of the multiplication, by adding all the values of a * x^i
    result = dictionary[bitsOn[0]];
    for(let i = 1; i < bitsOn.length; i++){
        result = Add(result,dictionary[bitsOn[i]]).split('');
    }

    return result;
        
}
    


class AES extends SymetricCipher{

    #GetSBox;

    #GetRCon;

    #GetRounds;

    constructor(){
        super();
        this.mustKeyLength = [128,192,256];
        this.#GetSBox = () => {
            try {
                const data = fs.readFileSync(__dirname + '/static/AESSbox.json');
                const sBox = JSON.parse(data);  // Parsear el JSON
                return sBox;
              } catch (err) {
                console.error('Error leyendo el archivo:', err);
              }
        }; 

        this.sBox = null;

        this.#GetRCon = () => ([
            "01","02","04","08","10","20","40","80","1b","36","6c","d8","ab","4d","9a","2f"
        ]);

        this.MatrixForMixColumns = [
            ["02","03","01","01"],
            ["01","02","03","01"],
            ["01","01","02","03"],
            ["03","01","01","02"]
        ];

        this.#GetRounds = () => ({
            128: 10,
            192: 12,
            256: 14
        });

    }

    HexGrouping(hex){
        let result = [];
        for(let i = 0; i < hex.length; i+=2){
            result.push(hex.slice(i,i+2));
        }
        return result;
    }

    #RotWord(word){
        // Receives a word in hex format (array, each element is a byte (2 hex characters))
        let copy = [...word];
        copy.push(copy.shift());
        return copy;
    }

    #SubstituteByte(byte){ //JUST FOR A BYTE
        // Receives a byte in hex format (2 hex characters)
        let row = byte[0];
        let column = byte[1];
        return this.sBox[row][column];
    }

    #SubWord(word){ //JUST FOR AN ARRAY OF 4 BYTES
        // Receives a word (4 bytes) in hex format (array, each element is a byte (2 hex characters))
        let newWord = new Array(Math.floor(word.length)); // 4 bytes
        for(let i = 0; i < word.length; i ++){
            newWord[i] = this.#SubstituteByte(word[i]);
        }
        return newWord;
    }

    
    KeyExpansion(key){
        // Receives a key in binary format
        let initialWords = [];
        let hex = "";
        let word = [];
        for(let i = 0; i < key.length; i+=32){
            hex = BinaryToHex(key.slice(i,i+32).join(''));
            word = this.HexGrouping(hex);
            initialWords.push(word);
        }
       
        let words = initialWords;
        const rounds = this.#GetRounds()[key.length];
        const divider = initialWords.length;
        const rCon = this.#GetRCon();

        const numberOfWordsRequired = 4 * (rounds + 1);
        for(let i = divider; i < numberOfWordsRequired; i++){
            let before = words[i-1];
            if(divider == 8 && i % 4 == 0){
                let subword = HexToBinary(this.#SubWord(this.#RotWord(before)).join(''));
                let result = XOR(HexToBinary(words[i-divider].join('')),subword);
                words.push(this.HexGrouping(BinaryToHex(result)));
            }
            else if(i % divider == 0){
                let roatedBeforeWord = this.#RotWord(words[i-1]);
                let subword = HexToBinary(this.#SubWord(roatedBeforeWord).join(''));
                let rConValue = HexToBinary(rCon[Math.floor(i/divider)]);
                rConValue = rConValue.padEnd(32,'0');
                let result = XOR(HexToBinary(words[i-divider].join('')),XOR(subword,rConValue));
                words.push(this.HexGrouping(BinaryToHex(result)));

            }
            else{
                let result = XOR(HexToBinary(words[i-1].join('')),HexToBinary(words[i-divider].join('')));
                result = this.HexGrouping(BinaryToHex(result));
                words.push(result);
            }
        }

        let keys = new Array(Math.floor(rounds + 1)).fill([]);
        for(let i = 0; i < rounds + 1; i++){
            keys[i] = words.slice(i*4,i*4+4);
        }

        return keys;
    }


    AddRoundKey(input,key){

        const shape = input.length;
        let result = Array.from({ length: shape }, () => []);
    
        for(let i = 0; i < shape; i++){
            for(let j = 0; j < shape; j++){
                result[i].push(
                    BinaryToHex(
                        XOR(
                        HexToBinary(input[i][j]),
                        HexToBinary(key[i][j]))
                    )
                );
            }
        }

        return result;
    }



    #SubstituteBytes(block){ //JUST FOR A BLOCK
        for(let i = 0; i < block.length; i++){
            block[i] = this.#SubWord(block[i]);
        }
    }

    #ShiftRows(block){ //JUST FOR A BLOCK (4x4)
        let left = [];
        let right = [];
        for(let i = 1; i < block.length; i++){
            left = block[i].slice(0,i);
            right = block[i].slice(i);
            block[i] = [...right,...left];
        }
    }

    #MixColumns(block){ //JUST FOR A BLOCK (4x4)

        for(let i = 0; i < 4; i++){
            for(let j = 0; j< 4; j++){
                block[i][j] = HexToBinary(block[i][j]);
            }
        }


        let result = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => "00000000"));

        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 4; j++){
                for(let k = 0; k < 4; k++){
                    result[i][j] = Add(result[i][j],Multiply(HexToBinary(this.MatrixForMixColumns[i][k]),block[k][j]));
                }
                result[i][j] = BinaryToHex(result[i][j]);
            }
        }

        return result;

    }


    EncryptBlock(block, subkeys) {
        let result = this.AddRoundKey(block,subkeys[0]);
        const cipherRoundsKeys = subkeys.slice(1,subkeys.length-1);
        const finalKey = subkeys[subkeys.length-1];
        for(const subkey of cipherRoundsKeys){
            this.#SubstituteBytes(result);
            this.#ShiftRows(result);
            result = this.#MixColumns(result);
            result = this.AddRoundKey(result,subkey);
        }
        this.#SubstituteBytes(result);
        this.#ShiftRows(result);
        result = this.AddRoundKey(result,finalKey);
        return result;
                
    }

    CreateBlocks(input){

        input = this.PrepareInput(input);
        const sizeOfBlock = 128;

        if(input % sizeOfBlock != 0){
            const paddingLength = sizeOfBlock - (input.length % sizeOfBlock);
            input = [...input, ...new Array(paddingLength).fill('0')];
        }

        input = this.HexGrouping(BinaryToHex(input.join('')));

        let blocks = Array.from({ length: Math.floor(input.length / 16) }, () => []);  

        for(let i = 0; i < input.length; i+=4){
            blocks[Math.floor(i/16)].push(input.slice(i,i+4));
        }

        return blocks;

    }


    Encrypt(input,key){

        key = this.PrepareKey(key);

        const keyLength = key.length;

        if(!key.length in this.mustKeyLength){
            return null;
        }

        try{
        this.sBox = this.sBox || this.#GetSBox();
        }
        catch(e){
            console.log(e);
            return null;
        }

        const keys = this.KeyExpansion(key);

        const blocks = this.CreateBlocks(input);

        let cipherText = [];
        for(let i = 0; i < blocks.length; i++){
            cipherText.push(this.EncryptBlock(blocks[i],keys));
        }

        console.log(cipherText);

    }


    DecryptBlock(input, subkeys) {
        
    }


    Decrypt(input,key){

        
    }

}


let p1 = ["0","0","1","0","1","0","1","1"]
let p2 = ["0","1","0","0","0","0","0","1"]

//console.log(Add(p1,p2));


p1 = ["0","1","0","1","0","1","1","1"]
p2 = ["1","0","0","0","0","0","1","1"]


//console.log(Multiply(p1,p2));


let myAES = new AES();

myAES.Encrypt("Springtrap is the best animatronic","HolaHolaHolaHola");

