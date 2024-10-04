
function GetMultiplicativeInverse(number,mod){
    for (let i = 1; i < mod; i++) {
        if((number * i) % mod == 1){
            return i;
        }
    }
    return 0;
}

function Mod(number,mod){
    return (number % mod + mod) % mod;
}


module.exports = {GetMultiplicativeInverse, Mod};