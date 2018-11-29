/*
    用于验证platON客户端项目的竞选合约
*/
const Web3 = require('web3'),
    config = require('./config/config.json');

const wallet = require('./l666.json'),
    abi = require('./abi/candidateConstract.json'),
    encodeParams = require('./lib/encodeParams'),
    getTransactionReceipt = require('./lib/getTransactionReceipt'),
    sign = require('./lib/sign'),
    password = 'aa123456'

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log('balance:', balance);

const calcContract = web3.eth.contract(abi),
    myContractInstance = calcContract.at(config.address.candidate);

getCandidateList()



/**
 * @description 节点候选人申请 / 增加质押;
 * @author liangyanxiang
 * @date 2018-11-29
 */
function candidateDeposit() {
    const nodeId = config.nodeId, //[64]byte 节点ID(公钥)
        owner = wallet.address, //[20]byte 质押金退款地址
        fee = '', //uint32 出块奖励佣金比，以10000为基数(eg：5 %，则fee = 500)
        host = '', //string 节点IP
        port = '', //string 节点端口号
        Extra = '', //string 附加数据(有长度限制，限制值待定)
        value = web3.toWei(100, 'ether');//质押金额为

    const data = myContractInstance.CandidateList.getPlatONData ();

    const hash = web3.eth.sendRawTransaction(sign(wallet, password, getParams(data, value)))
    console.log(hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
    })

}

/**
 * @description 节点质押金退回申请，申请成功后节点将被重新排序
 * @author liangyanxiang
 * @date 2018-11-29
 */
function candidateApplyWithdraw() {

}

/**
 * @description 获取所有入围节点的信息列表
 * @author liangyanxiang
 * @date 2018-11-29
 */
function getCandidateList() {
    const data = myContractInstance.CandidateList.getPlatONData()

    // const hash = web3.eth.sendRawTransaction(sign(wallet, 'aa123456', getParams(data)))
    // console.log(hash)
    // getTransactionReceipt(hash, (code, data) => {
    //     console.log(code, data)
    // })

    const result = web3.eth.call ({
        from: wallet.address,
        to: myContractInstance.address,
        data: data,
    });

    myContractInstance.decodePlatONCall (result);
    console.log ('platONCall result:', result);

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
    const nonce = web3.eth.getTransactionCount(wallet.address)
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