const Web3 = require ('web3'), config = require ('../config/config.json');
const web3 = new Web3 (new Web3.providers.HttpProvider (config.provider));


let wrapCount = 60;
function getTransactionReceipt(hash, fn) {
    console.log('getTransactionReceipt hash==>', hash);
    let id = '',
        result = web3.eth.getTransactionReceipt(hash),
        data = {};
    console.log(`result:`, result)
    if (result && result.transactionHash && hash == result.transactionHash) {
        clearTimeout(id);
        if (result.logs.length != 0) {
            console.log('sendRawTrasaction result==>', data);
            fn(0, result);
            delete fn;
        } else {
            fn(1001, '合约异常，失败');
        }
    } else {
        if (wrapCount--) {
            id = setTimeout(() => {
                getTransactionReceipt(hash, fn);
            }, 1000);
        } else {
            fn(1000, '超时');
            console.warn('sendRawTrasaction超时');
            id = '';
            delete fn;
        }
    }
}

module.exports = getTransactionReceipt