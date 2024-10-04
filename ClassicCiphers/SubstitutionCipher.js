const Cipher = require('../Cipher.js');

const {isAlphabetic } = require('../TextLib.js');


class SubstitutionCipher extends Cipher{

    CompleteKey(key){
        let keyOtherScenario = {};
        for (let k in key) {
            if (k === k.toUpperCase()) {
                keyOtherScenario[k.toLowerCase()] = key[k].toLowerCase();
                keyOtherScenario[k] = key[k];
            } else {
                keyOtherScenario[k.toUpperCase()] = key[k].toUpperCase();
                keyOtherScenario[k] = key[k];
            }
        }

        return {...key,...keyOtherScenario};
    }


    async Encrypt(text,pKey){

        let key = this.CompleteKey(pKey);

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
            if (!isAlphabetic(char)) {
                return char;
            }
            if (char === char.toUpperCase()) {
                char = char.toLowerCase();
                char = key[char];
                return char.toUpperCase();
            }
            return key[char];
        }).join('');
    }

    async Decrypt(text,pKey){
        let key = this.CompleteKey(pKey);

        key = Object.keys(key).reduce((acc,curr) => {
            acc[key[curr]] = curr;
            return acc;
        },{});

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
            if (!isAlphabetic(char)) {
                return char;
            }
            if (char === char.toUpperCase()) {
                char = char.toLowerCase();
                char = key[char];
                return char.toUpperCase();
            }
            return key[char];
        }).join('');
    }

}

if (require.main === module) {
    (async () => {
        let cipher = new SubstitutionCipher();
        let key = {
            'a':'z',
            'b':'y',
            'c':'x',
            'd':'w',
            'e':'v',
            'f':'u',
            'g':'t',
            'h':'s',
            'i':'r',
            'j':'q',
            'k':'p',
            'l':'o',
            'm':'n',
            'n':'m',
            'o':'l',
            'p':'k',
            'q':'j',
            'r':'i',
            's':'h',
            't':'g',
            'u':'f',
            'v':'e',
            'w':'d',
            'x':'c',
            'y':'b',
            'z':'a'
        }
        let text = 'Springtrap is the best animatronic in the FNAF series';
        console.time("Encryption");
        let encrypted = await cipher.Encrypt(text,key);
        console.timeEnd("Encryption");
        console.log(encrypted);

        console.time("Decryption");
        let decrypted = await cipher.Decrypt(encrypted,key);
        console.timeEnd("Decryption");

        console.log(decrypted);
        
    })();
}


module.exports = SubstitutionCipher;