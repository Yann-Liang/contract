/*
    用于验证platON客户端项目的竞选合约
*/
const Web3 = require('web3'),
    config = require('./config/config.json');

const wallet = require('./l666.json'),
    abi = require('./abi/candidateConstract.json'),
    encodeParams = require('./lib/encodeParams'),
    getTransactionReceipt = require('./lib/getTransactionReceipt')

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
console.log(web3);

const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log('balance:', balance);

const calcContract = web3.eth.contract(abi);

const myContractInstance = calcContract.at(
    `0x1000000000000000000000000000000000000001`
);