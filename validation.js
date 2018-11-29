/*
    用于验证platON客户端项目的竞选合约
*/
const Web3 = require('web3'),
    config = require('./config/config.json');

const wallet = require('./l666.json'),
    abi = require('./abi/candidateConstract.json'),
    encodeParams = require('./lib/encodeParams'),
    getTransactionReceipt = require('./lib/getTransactionReceipt'),
    sign=require('./lib/sign')

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
console.log(web3);

const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log('balance:', balance);

const calcContract = web3.eth.contract(abi);

const myContractInstance = calcContract.at(config.address.candidate);




getCandidateList()





/**
 * @description 获取所有入围节点的信息列表
 * @author liangyanxiang
 * @date 2018-11-29
 */
function getCandidateList() {
    const data = myContractInstance.CandidateList.getPlatONData()

    const hash = web3.eth.sendTransaction(sign(getParams(data)))

    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
    })
}



/**
 * @description 获取发送sendRawTransaction的params
 * @author liangyanxiang
 * @date 2018-11-29
 * @param {string} [data='']
 * @param {string} [value="0x0"]
 * @returns
 */
function getParams(data='',value= "0x0") {
    const nonce = web3.eth.getTransactionCount(account)
    //nonce：sendTransaction可以不传，sendRowTransaction必须传
    const params = {
        from: wallet.address,
        gasPrice: '0x8250de00',
        gas: '0x706709',
        to: myContractInstance.address,
        value,
        data,
        nonce
    }

    return params
}