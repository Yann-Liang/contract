const Web3 = require('web3'),
    config = require('../config/config.json');
const web3 = new Web3 (new Web3.providers.HttpProvider (config.provider));

let wrapCount = 60;
function getTransactionReceipt(hash, fn) {
    let id = '',
        result = web3.eth.getTransactionReceipt(hash),
        data = {};
    if (result && result.transactionHash && hash == result.transactionHash) {
        clearTimeout(id);
        if (result.logs.length != 0) {
            fn(0, result);
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
            id = '';
        }
    }
}

module.exports = getTransactionReceipt