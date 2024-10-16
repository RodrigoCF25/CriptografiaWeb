const {TextToBinary, BinaryToText, TextToHex, HexToText, BinaryToHex, XOR, HexToBinary} = require('../BinaryOperations');

const {RemoveExtraEmptySpaces} = require('../TextLib');


const {SymetricCipher, TypeOfInput} = require('./SymetricCipher');


const sBox = require("./static/AESSBox.json");


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

        this.#GetSBox = () => (sBox);     
     
        
        this.#GetRCon = () => ([
            "01","02","04","08","10","20","40","80","1b","36","6c","d8","ab","4d","9a","2f"
        ]);

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

    
    KeyExpansion(key){
        // Receives a key in binary format
        const RotWord = (word) => {
            // Receives a word in hex format (array, each element is a byte (2 hex characters))
            let copy = [...word];
            copy.push(copy.shift());
            return copy;
        }

        const SubWord = (word, sBox) => {
            // Receives a word in hex format (array, each element is a byte (2 hex characters))
            let newWord = new Array(Math.floor(word.length)); // 4 bytes
            for(let i = 0; i < word.length; i ++){
                let row = word[i][0];
                let column = word[i][1];
                newWord[i] = sBox[row][column];
            }
            return newWord;
        }

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
        const sBox = this.#GetSBox();
        const rCon = this.#GetRCon();

        const numberOfWordsRequired = 4 * (rounds + 1);
        for(let i = divider; i < numberOfWordsRequired; i++){
            let before = words[i-1];
            if(divider == 8 && i % 4 == 0){
                let subword = HexToBinary(SubWord(RotWord(before),sBox).join('')).split('');
                let result = XOR(HexToBinary(words[i-divider].join('')).split(''),subword);
                words.push(this.HexGrouping(BinaryToHex(result)));
            }
            else if(i % divider == 0){
                let roatedBeforeWord = RotWord(words[i-1]);
                let subword = HexToBinary(SubWord(roatedBeforeWord,sBox).join('')).split('');
                let rConValue = HexToBinary(rCon[Math.floor(i/divider)]).split('');
                let result = XOR(HexToBinary(words[i-divider].join('')).split(''),XOR(subword,rConValue));
                words.push(this.HexGrouping(BinaryToHex(result)));

            }
            else{
                let result = XOR(HexToBinary(words[i-1].join('')).split(''),HexToBinary(words[i-divider].join('')).split(''));
                result = this.HexGrouping(BinaryToHex(result));
                words.push(result);
            }
        }

        let keys = new Array(Math.floor(rounds + 1)).fill([]);
        for(let i = 0; i < rounds + 1; i++){
            keys[i] = words.slice(i*4,i*4+4);
        }

        return function*(){

            let roundCounter = 0;
            while(true){
                yield keys[roundCounter];
                roundCounter++;
                if(roundCounter > rounds){
                    roundCounter = 0;
                }
            }

        }.bind(this)();


    }


    AddRoundKey(input,key){
        
    }




    EncryptBlock(input, subkeys) {
        
    }


    Encrypt(input,key){

        key = this.PrepareKey(key);

        if(!key.length in this.mustKeyLength){
            return null;
        }

        input = this.PrepareInput(input);

        let keyExpansionGenerator = this.KeyExpansion(key);

        for(let i = 0; i <= 10; i++){
            console.log(keyExpansionGenerator.next().value);
        }

        
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

myAES.Encrypt("Hola","HolaHolaHolaHola");


