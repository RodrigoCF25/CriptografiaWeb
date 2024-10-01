// CommonJS
const Cipher = require('./Cipher.js');

class CaesarCipher extends Cipher{

    async Encrypt(text,key){
        
        text = this.PrepareText(text);

        let sizeOfBlock = this.CalculateSizeOfBlock(text);

        let encryptedBlocks = [];

        for (let i = 0; i < text.length; i++) {
            let block = text.splice(0,sizeOfBlock)
            encryptedBlocks.push(this.EncryptBlock(block,key));
        }

        const results = await Promise.all(encryptedBlocks);
        return results.join('');
       
    }

    async EncryptBlock(text,key){
        return text.map((char) => {
            let result = char.charCodeAt(0);
            if(result >= 65 && result <= 90){
                result = (result - 65 + key) % 26 + 65;
            }else if(result >= 97 && result <= 122){
                result = (result - 97 + key) % 26 + 97;
            }
            return String.fromCharCode(result);
        }).join('');
    }

    async Decrypt(text,key){
        text = this.PrepareText(text);

        
        let sizeOfBlock = this.CalculateSizeOfBlock(text);
        


        let decryptedBlocks = [];

        for (let i = 0; i < text.length; i++) {
            let block = text.splice(0,sizeOfBlock)
            decryptedBlocks.push(this.DecryptBlock(block,key));
        }

        const results = await Promise.all(decryptedBlocks);
        return results.join('');
    }

    async DecryptBlock(text,key){
        return text.map((char) => {
            let result = char.charCodeAt(0);
            if(result >= 65 && result <= 90){
                result = (result - 65 - key + 26) % 26 + 65;
            }else if(result >= 97 && result <= 122){
                result = (result - 97 - key + 26) % 26 + 97;
            }
            return String.fromCharCode(result);
        }).join('');

    }
}

if (require.main === module) {

    let text = `Springtrap is the best animatronic in the FNAF series`;

    key = 5;

    let cipher = new CaesarCipher();

    //Primera opción: función autoejecutable async

    (async () => {
        console.time("Encryption");
        let encryptedText = await cipher.Encrypt(text,key);
        console.timeEnd("Encryption");
        console.log(encryptedText);

        console.time("Decryption");
        let decryptedText = await cipher.Decrypt(encryptedText,key);
        console.timeEnd("Decryption");
        console.log(decryptedText);
    })();

    //Segunda opción : Manejo de promesas
    /*
    cipher.Encrypt(text,key).then((encryptedText) => {
        console.log(encryptedText);
        cipher.Decrypt(encryptedText,key).then((decryptedText) => {
            console.log(decryptedText);
        });
    })
    */
}

//CommonJS
module.exports = CaesarCipher;