const {TextToBinary, BinaryToText, TextToHex, HexToText, BinaryToHex, XOR, HexToBinary} = require('../BinaryOperations');

const {RemoveExtraEmptySpaces} = require('../TextLib');

const {SymetricCipher} = require('./SymetricCipher');

const {Transpose} = require('../MatrixLib');

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
    a = [...a];
    b = [...b];

    const AbitsOn = a.reduce((acc,bit,index) => {
        if(bit === "1"){
            acc.push( 8 - 1 - index);
        }
        return acc;
    },[]);

    const BbitsOn = b.reduce((acc,bit,index) => {
        if(bit === "1"){
            acc.push( 8 - 1 - index);
        }
        return acc;
    },[]);

    if (AbitsOn.length === 0 || BbitsOn.length === 0){
        return new Array(8).fill("0");
    }

    let lowerPolynomial;
    let higherPolynomial;
    let bitsOnOfLowerPolynomial;

    if(AbitsOn[0] >= BbitsOn[0]){
        lowerPolynomial = [...b];
        higherPolynomial = [...a];
        bitsOnOfLowerPolynomial = BbitsOn;

    }else{
        lowerPolynomial = [...a];
        higherPolynomial = [...b];
        bitsOnOfLowerPolynomial = AbitsOn;
    }

    let dictionary = {};
    dictionary[0] = higherPolynomial.join('');
    let product = higherPolynomial.join('');


    for(let i = 1; i <= bitsOnOfLowerPolynomial[0]; i++){
        product = MultiplyByX(product);
        if (bitsOnOfLowerPolynomial.includes(i)){
            dictionary[i] = product.join('');
        }
    }

    let result = dictionary[bitsOnOfLowerPolynomial[0]];

    for(let i = 1; i < bitsOnOfLowerPolynomial.length; i++){
        result = Add(result,dictionary[bitsOnOfLowerPolynomial[i]]);
    }

    return result;

}
    


class AES extends SymetricCipher{

    #GetSBoxAndMatrixForMixColumns

    #GetRCon;

    #GetRounds;

    constructor(){
        super();
        this.mustKeyLength = [16,24,32];

        this.#GetSBoxAndMatrixForMixColumns = () => {
            try {
                const data = fs.readFileSync(__dirname + '/static/AES.json');
                const jsonData = JSON.parse(data);  // Parsear el JSON
                const sBox = jsonData["sBox"];
                const MixColumns = jsonData["MixColumns"];
                return {sBox, MixColumns};
              } catch (err) {
                console.error('Error leyendo el archivo:', err);
              }
        }; 

        this.sBox = null;

        this.#GetRCon = () => ([
            "01","02","04","08","10","20","40","80","1b","36","6c","d8","ab","4d","9a","2f"
        ]);

        this.MatrixForMixColumns = [
            ["00000010", "00000011", "00000001", "00000001"],
            ["00000001", "00000010", "00000011", "00000001"],
            ["00000001", "00000001", "00000010", "00000011"],
            ["00000011", "00000001", "00000001", "00000010"]
        ]

        this.#GetRounds = () => ({
            16: 10,
            24: 12,
            32: 14
        });

    }

    HexGrouping(hex){
        let result = [];
        for(let i = 0; i < hex.length; i+=2){
            result.push(hex.slice(i,i+2));
        }
        return result;
    }

    PrepareInput(input){

        input = RemoveExtraEmptySpaces(input);
        const typeOfInput = this.IdentifyFormat(input);

        switch(typeOfInput){
            case this.TypeOfInput.TEXT:{
                return this.HexGrouping(TextToHex(input, ''));

            }
            case this.TypeOfInput.BINARY:{
                
                return this.HexGrouping(BinaryToHex(input,''));
                
            }
            case this.TypeOfInput.HEX:{
                return this.HexGrouping(input);
            }
        }

    }


    PrepareKey(key){

        key = RemoveExtraEmptySpaces(key);
        const typeOfInput = this.IdentifyFormat(key);

        switch(typeOfInput){
            case this.TypeOfInput.TEXT:{
                return this.HexGrouping(TextToHex(key, ''));

            }
            case this.TypeOfInput.BINARY:{
                
                return this.HexGrouping(BinaryToHex(key,''));
                
            }
            case this.TypeOfInput.HEX:{
                return this.HexGrouping(key);
            }
        }


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

        for(let i = 0; i < key.length; i+=4){
            let word = key.slice(i,i+4);
            initialWords.push(word);
        }
       
        let words = initialWords;
        const rounds = this.#GetRounds()[key.length];
        const divider = initialWords.length;
        const rCon = this.#GetRCon();

        const numberOfWordsRequired = 4 * (rounds + 1);
        for(let i = divider; i < numberOfWordsRequired; i++){
            let before = words[i-1];
            if(divider == 8 && i % 8 == 4){
                let subword = HexToBinary(this.#SubWord(this.#RotWord(before)).join(''));
                let result = XOR(HexToBinary(words[i-divider].join('')),subword);
                words.push(this.HexGrouping(BinaryToHex(result)));
            }
            else if(i % divider == 0){
                let roatedBeforeWord = this.#RotWord(words[i-1]);
                let subword = HexToBinary(this.#SubWord(roatedBeforeWord).join(''));
                let rConValue = HexToBinary(rCon[Math.floor((i/divider)) - 1]);
                rConValue = rConValue.padEnd(32,"0");
                let result = XOR(HexToBinary(words[i-divider].join('')),XOR(subword,rConValue));
                words.push(this.HexGrouping(BinaryToHex(result)));
            }
            else{
                let result = XOR(HexToBinary(words[i-1].join('')),HexToBinary(words[i-divider].join('')));
                result = this.HexGrouping(BinaryToHex(result));
                words.push(result);
            }
        }

        let keys = Array.from({ length: rounds + 1 }, () => []);
        for(let i = 0; i < rounds + 1; i++){
            keys[i] = words.slice(i*4,i*4+4);
        }

        //But we need to transpose the keys
        for(let i = 0; i < keys.length; i++){
            keys[i] = Transpose(keys[i]);
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


        let result = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => "0".padEnd(8,"0")));

        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 4; j++){
                for(let k = 0; k < 4; k++){
                    result[i][j] = Add(result[i][j],Multiply(this.MatrixForMixColumns[i][k],block[k][j]));
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

        result = Transpose(result);
        return result;
                
    }

    CreateBlocks(input){

        input = this.PrepareInput(input);
        const sizeOfBlock = 16;
        
        if(input.length % sizeOfBlock != 0){
            const paddingLength = sizeOfBlock - (input.length % sizeOfBlock);
            input = [...input, ...new Array(paddingLength).fill('00')];
        }

        let blocks = Array.from({ length: Math.floor(input.length / 16) }, () => []);  

        for(let i = 0; i < input.length; i+=4){
            blocks[Math.floor(i/16)].push(input.slice(i,i+4));
        }

        //But we need to transpose the blocks
        for(let i = 0; i < blocks.length; i++){
            blocks[i] = Transpose(blocks[i]);
        }

        return blocks;

    }


    Encrypt(input,key){

        key = this.PrepareKey(key);
        const keyLength = key.length;


        if(!this.mustKeyLength.includes(keyLength)){
            throw new Error(`Invalid key length, must be 16, 24 or 32 bytes. Not ${keyLength}`);
        }

        const action = "Encrypt";

        try{
            const {sBox, MixColumns} = this.#GetSBoxAndMatrixForMixColumns();
            this.sBox = sBox[action];
            this.MatrixForMixColumns = MixColumns[action];
        }
        catch(e){
            throw new Error("Error getting the SBox");
        }
        
        const keys = this.KeyExpansion(key);
        const blocks = this.CreateBlocks(input);

        let cipherText = Array.from({ length: blocks.length }, undefined);
        for(let i = 0; i < blocks.length; i++){
            cipherText[i] = this.EncryptBlock(blocks[i],keys).flat().join('');
        }
        
        cipherText = cipherText.join('');

        return cipherText;
    }


    TestAddRoundKey(){

        let block = [
            ["47","40","a3","4c"],
            ["37","d4","70","9f"],
            ["94","e4","3a","42"],
            ["ed","a5","a6","bc"]
        ]

        let key = [
            ["ac","19","28","57"],
            ["77","fa","d1","5c"],
            ["66","dc","29","00"],
            ["f3","21","41","6a"]
        ]

        let result = this.AddRoundKey(block,key);
        console.log("Result: ",result);
        console.log("Expected: ");
        const expected = [
            ["eb","59","8b","1b"],
            ["40","2e","a1","c3"],
            ["f2","38","13","42"],
            ["1e","84","e7","d6"]
        ];
        console.log(expected);

        if(result.flat().join('') == expected.flat().join('')){
            console.log("Test passed");
        }
        else{
            console.log("Test failed");
        }
    }

    TestSubstituteBytes(){

        try{
            const {sBox, MixColumns} = this.#GetSBoxAndMatrixForMixColumns();
            this.sBox = sBox["Encrypt"];
            this.MatrixForMixColumns = MixColumns["Encrypt"];
        }
        catch(e){
            console.log(e);
            return null;
        }


        let block = [
            ["ea","04","65","85"],
            ["83","45","5d","96"],
            ["5c","33","98","b0"],
            ["f0","2d","ad","c5"]
        ]

        try{
            const {sBox, MixColumns} = this.#GetSBoxAndMatrixForMixColumns();
            this.sBox = sBox["Encrypt"];
            this.MatrixForMixColumns = MixColumns["Encrypt"];
        }
        catch(e){
            throw new Error("Error getting the SBox");
        }

        this.#SubstituteBytes(block);

        console.log("Result: ",block);
        console.log("Expected: ");
        const expected = [
            ["87","f2","4d","97"],
            ["ec","6e","4c","90"],
            ["4a","c3","46","e7"],
            ["8c","d8","95","a6"]
        ];
        console.log(expected);

        if(block.flat().join('') == expected.flat().join('')){
            console.log("Test passed");
        }
        else{
            console.log("Test failed");
        }
    }

    TestShiftRows(){

        let block = [
            ["87","f2","4d","97"],
            ["ec","6e","4c","90"],
            ["4a","c3","46","e7"],
            ["8c","d8","95","a6"]
        ]

        this.#ShiftRows(block);

        console.log("Result: ",block);

        console.log("Expected: ");

        const expected = [
            ["87","f2","4d","97"],
            ["6e","4c","90","ec"],
            ["46","e7","4a","c3"],
            ["a6","8c","d8","95"]
        ];

        console.log(expected);

        if(block.flat().join('') == expected.flat().join('')){
            console.log("Test passed");
        }
        else{
            console.log("Test failed");
        }
    }


    TestMixColumns(){
        let block = [
            ["87","f2","4d","97"],
            ["6e","4c","90","ec"],
            ["46","e7","4a","c3"],
            ["a6","8c","d8","95"]
        ]

        try{
            const {sBox, MixColumns} = this.#GetSBoxAndMatrixForMixColumns();
            this.sBox = sBox["Encrypt"];
            this.MatrixForMixColumns = MixColumns["Encrypt"];
        }
        catch(e){
            throw new Error("Error getting the matrix for MixColumns");
            return null;
        }

        let result = this.#MixColumns(block);

        console.log("Result: ",result);

        console.log("Expected: ");

        const expected = [
            ["47","40","a3","4c"],
            ["37","d4","70","9f"],
            ["94","e4","3a","42"],
            ["ed","a5","a6","bc"]
        ];

        console.log(expected);

        if(result.flat().join('') == expected.flat().join('')){
            console.log("Test passed");
        }
        else{
            console.log("Test failed");
        }
    }


    TestKeyExpansion(){
        let key = "satishcjisboring";

        key = this.PrepareKey(key);

        const keyLength = key.length;

        if(!this.mustKeyLength.includes(keyLength)){
            throw new Error(`Invalid key length, must be 16, 24 or 32 bytes. Not ${keyLength}`);
        }

        try{
            const {sBox, MixColumns} = this.#GetSBoxAndMatrixForMixColumns();
            this.sBox = sBox["Encrypt"];
            this.MatrixForMixColumns = MixColumns["Encrypt"];
        }
        catch(e){
            throw new Error("Error getting the SBox");
        }

        const keys = this.KeyExpansion(key);

        console.log(keys);


    }


    #InverseShiftRows(block){ //JUST FOR A BLOCK (4x4)
        let left = [];
        let right = [];
        for(let i = 3; i > 0; i--){
            left = block[i].slice(0,4-i);
            right = block[i].slice(4-i);
            block[i] = [...right,...left];
        }
    }

    #InverseSubstituteBytes(byte){ //Since we have load the sBox for Decrypt, we can use the same function
        // Receives a byte in hex format (2 hex characters)
        this.#SubstituteBytes(byte);
    }

    #InverseMixColumns(block){ //Since we have load the matrix for Decrypt, we can use the same function
        return this.#MixColumns(block);
    }




    DecryptBlock(input, subkeys) {

        const firstKey = subkeys[0];
        const cipherRoundsKeys = subkeys.slice(1,subkeys.length-1).reverse();
        const finalKey = subkeys[subkeys.length-1];

        let result = this.AddRoundKey(input,finalKey);
        for (const subkey of cipherRoundsKeys){
            this.#InverseShiftRows(result);
            this.#InverseSubstituteBytes(result);
            result = this.AddRoundKey(result,subkey);
            result = this.#InverseMixColumns(result);
        }

        this.#InverseShiftRows(result);
        this.#InverseSubstituteBytes(result);
        result = this.AddRoundKey(result,firstKey);

        result = Transpose(result);
        result = result.flat().join('');

        result = HexToText(result,'');

        return result;

    }


    Decrypt(input,key){

        key = this.PrepareKey(key);

        const keyLength = key.length;

        if(!this.mustKeyLength.includes(keyLength)){
            return null;
        }


        try{
            const {sBox, MixColumns} = this.#GetSBoxAndMatrixForMixColumns();
            this.sBox = sBox;
            this.MatrixForMixColumns = MixColumns["Decrypt"];
        }
        catch(e){
            console.log(e);
            return null;
        }

        const sBoxDecrypt = this.sBox["Decrypt"];

        const sBoxForGenerateKey = this.sBox["Encrypt"];

        this.sBox = sBoxForGenerateKey;

        const keys = this.KeyExpansion(key);

        if(input.length % keyLength != 0){
            return null;
        }

        this.sBox = sBoxDecrypt


        const blocks = this.CreateBlocks(input);

        let plainText = Array.from({ length: blocks.length }, undefined);

        for(let i = 0; i < blocks.length; i++){
            plainText[i] = this.DecryptBlock(blocks[i],keys);
        }
        
        plainText = plainText.join('');

        plainText.trim();


        return plainText;
    }

}


module.exports = AES;


//Execute if the file is run directly

if (require.main === module) {

    let myAES = new AES();

    text = "Springtrap is the best animatronic";

    key = "HolaHolaHolaHola";

    cipherText = myAES.Encrypt(text,key);

    console.log(cipherText);

    console.log(myAES.Decrypt(cipherText,key));
    

}