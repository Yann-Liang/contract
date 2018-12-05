/*
    用于验证platON客户端项目的竞选合约
*/
const Web3 = require('web3'),
    config = require('../config/config.json');

const wallet = require('../l666.json'),
    abi = require('../abi/candidateConstract.json'),
    encodeParams = require('../lib/encodeParams'),
    getTransactionReceipt = require('../lib/getTransactionReceipt'),
    sign = require('../lib/sign'),
    password = 'aa123456'

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log('balance:', web3.fromWei(balance));

const calcContract = web3.eth.contract(abi),
    myContractInstance = calcContract.at(config.address.candidate);


/**
 * @description 节点候选人申请 / 增加质押;
 * @author liangyanxiang
 * @date 2018-11-29
 */
function candidateDeposit() {
    const nodeId = config.nodeId, //[64]byte 节点ID(公钥)
        owner = wallet.address, //[20]byte 质押金退款地址
        fee = 500, //uint32 出块奖励佣金比，以10000为基数(eg：5 %，则fee = 500)
        { host, port } = config, //string 节点IP string 节点端口号
        Extra = web3.toHex({
            nodeName: '节点名称',
            nodeDiscription: '节点简介',
            nodeDepartment: '机构名称',
            officialWebsite: 'www.platon.network',
            nodePortrait: 'URL',
            time: Date.now(), //加入时间
            //nodeId,//节点ID
            owner, //节点退款地址
        }), //string 附加数据(有长度限制，限制值待定)
        value = 1;//质押金额

    const data = myContractInstance.CandidateDeposit.getPlatONData(nodeId, owner, fee, host, port, Extra);
    // web3.personal.unlockAccount (wallet.address, password, 9999999);
    // const hash=web3.eth.sendTransaction(getParams(data,value))
    const hash = web3.eth.sendRawTransaction(sign(wallet, password, getParams(data, value)))
    console.log('hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        let res = myContractInstance.decodePlatONLog(data.logs[0]);
        if (res.length && res[0]) {
            res = JSON.parse(res[0])
            if (res.ErrMsg == 'success') {
                console.log(`节点候选人申请 / 增加质押成功`);
            } else {
                console.log(`节点候选人申请 / 增加质押失败`);
            }
        } else {
            console.log(`节点候选人申请 / 增加质押失败`)
        }
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

    const result = web3.eth.call({
        from: wallet.address,
        to: myContractInstance.address,
        data: data,
    });

    const res = myContractInstance.decodePlatONCall(result);

    console.log(`所有入围节点的信息列表:`, res.data);
    let resData
    if (res.data) {
        if (res.data == '0x') {
            console.log(`所有入围节点的信息列表为空。`, res.data);
            return []
        } else {
            try {
                resData = JSON.parse(res.data)
            } catch (error) {
                console.warn(`CandidateList result error`, error)
                throw new Error(error)
            }
            resData.map(item => {
                item.Extra = JSON.parse(web3.toUtf8(item.Extra))
                return item
            })
        }

    }

    return resData
}

/**
 * @description 获取参与当前共识的验证人列表
 * @author liangyanxiang
 * @date 2018-11-30
 */
function verifiersList() {
    const data = myContractInstance.VerifiersList.getPlatONData()

    const result = web3.eth.call({
        from: wallet.address,
        to: myContractInstance.address,
        data: data,
    });

    myContractInstance.decodePlatONCall(result);
    console.log('verifiersList result:', result);
}


/**
 * @description 获取发送sendRawTransaction的params
 * @author liangyanxiang
 * @date 2018-11-29
 * @param {string} [data='']
 * @param {string} [value="0x0"]
 * @returns
 */
function getParams(data = '', value = "0x0") {
    //nonce：sendTransaction可以不传，sendRowTransaction必须传
    const nonce = web3.eth.getTransactionCount(wallet.address)
    value = web3.toHex(web3.toWei(value, 'ether'));

    const params = {
        from: wallet.address,
        gasPrice: 22 * 10e9,
        gas: 80000,
        to: myContractInstance.address,
        value,
        data,
        nonce
    }

    return params
}






module.exports = {
    getCandidateList,
    candidateDeposit,
    verifiersList,
}