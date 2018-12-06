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
        value = 5;//质押金额

    const data = myContractInstance.CandidateDeposit.getPlatONData(nodeId, owner, fee, host, port, Extra);
    // web3.personal.unlockAccount (wallet.address, password, 9999999);
    // const hash=web3.eth.sendTransaction(getParams(data,value))
    const hash = web3.eth.sendRawTransaction(sign(wallet, password, getParams(data, value)))
    console.log('hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        if (code == 0) {
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
        } else {
            console.warn (`节点候选人申请 / 增加质押异常`);
        }
    })

}

/**
 * @description 节点质押金退回申请，申请成功后节点将被重新排序
 * @author liangyanxiang
 * @date 2018-11-29
 */
function candidateApplyWithdraw() {
    const nodeId = config.nodeId //[64]byte 节点ID(公钥)

    const data = myContractInstance.CandidateDeposit.getPlatONData(nodeId);
    const hash = web3.eth.sendRawTransaction(
        sign(wallet, password, getParams(data))
    );
    console.log('hash', hash);
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data);
        let res = myContractInstance.decodePlatONLog(data.logs[0]);
        if (res.length && res[0]) {
            res = JSON.parse(res[0]);
            if (res.ErrMsg == 'success') {
                console.log(`节点候选人申请 / 增加质押成功`);
            } else {
                console.log(`节点候选人申请 / 增加质押失败`);
            }
        } else {
            console.log(`节点候选人申请 / 增加质押失败`);
        }
    });

}

/**
 * @description 获取候选人信息
 * @author liangyanxiang
 * @returns
 */
function candidateDetails() {
    const nodeId = config.nodeId //[64]byte 节点ID(公钥)

    const data = myContractInstance.CandidateDetails.getPlatONData(nodeId)

    const result = web3.eth.call({
        from: wallet.address,
        to: myContractInstance.address,
        data: data,
    });

    const result1 = myContractInstance.decodePlatONCall(result);
    const result2 = toObj(result1.data)
    console.log('获取候选人信息结果:', result2);
    return result2
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

    const result1 = myContractInstance.decodePlatONCall(result);

    const result2 = toObj(result1.data)
    console.log(`所有入围节点的信息列表:`, result2);
    return result2
}

/**
 * @description 获取参与当前共识的验证人列表
 * @author liangyanxiang
 * @returns [] result2
 * @date 2018-11-30
 */
function verifiersList() {
    const data = myContractInstance.VerifiersList.getPlatONData()

    const result = web3.eth.call({
        from: wallet.address,
        to: myContractInstance.address,
        data: data,
    });

    const result1 = myContractInstance.decodePlatONCall(result);
    const result2 = toObj(result1.data)
    console.log('获取参与当前共识的验证人列结果:', result2);
    return result2
}

/**
 * @description 获取节点申请的退款记录列表
 * @author liangyanxiang
 */
function candidateWithdrawInfos() {
    const nodeId = config.nodeId //[64]byte 节点ID(公钥)

    const data = myContractInstance.CandidateWithdrawInfos.getPlatONData(nodeId)

    const result = web3.eth.call({
        from: wallet.address,
        to: myContractInstance.address,
        data: data,
    });

    const result1 = myContractInstance.decodePlatONCall(result);
    const result2 = toObj(result1.data)
    console.log('获取节点申请的退款记录列表结果:', result2);
    return result2
}

/**
 * @description 设置节点附加信息，供前端扩展使用。
 * @author liangyanxiang
 */
function setCandidateExtra() {
    const nodeId = config.nodeId, //[64]byte 节点ID(公钥)
        owner = wallet.address, //[20]byte 质押金退款地址
        time = Date.now(),
        Extra = web3.toHex({
            nodeName: '节点名称',
            nodeDiscription: '节点简介' + time,
            nodeDepartment: '机构名称' + time,
            officialWebsite: 'www.platon.network',
            nodePortrait: 'URL',
            time: time, //加入时间
            owner, //节点退款地址
        }) //string 附加数据(有长度限制，限制值待定)

    const data = myContractInstance.SetCandidateExtra.getPlatONData(nodeId, Extra);
    const hash = web3.eth.sendRawTransaction(sign(wallet, password, getParams(data)))
    console.log('setCandidateExtra hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        let res = myContractInstance.decodePlatONLog(data.logs[0]);
        if (res&&res[0] ) {
            res = JSON.parse(res[0])
            if (res.ErrMsg == 'success') {
                console.log(`设置节点附加信息成功`);
            } else {
                console.log(`设置节点附加信息失败`);
            }
        } else {
            console.log(`设置节点附加信息失败`)
        }
    })
}

/**
 * @description 节点质押金退回申请，申请成功后节点将被重新排序，权限校验from==owner。
 * @author liangyanxiang
 */
function candidateApplyWithdraw() {
    const nodeId = config.nodeId, //[64]byte 节点ID(公钥)
        withdraw = Number(web3.toWei(2, 'ether'));

    const data1 = myContractInstance.CandidateApplyWithdraw.getData(nodeId, withdraw);
    const data = myContractInstance.CandidateApplyWithdraw.getPlatONData(nodeId, withdraw);
    const hash = web3.eth.sendRawTransaction(sign(wallet, password, getParams(data, )))
    console.log('hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        if (code == 0) {
            let res = myContractInstance.decodePlatONLog(data.logs[0], 'CandidateApplyWithdrawEvent');
            if (res.length && res[0]) {
                res = JSON.parse(res[0])
                if (res.ErrMsg == 'success') {
                    console.log(`节点质押金退回申请成功`);
                } else {
                    console.log(`节点质押金退回申请失败`);
                }
            } else {
                console.log(`节点质押金退回申请失败`)
            }
        } else {
            console.warn(`节点质押金退回申请异常`)
        }
    })
}

/**
 * @description 节点质押金提取，调用成功后会提取所有已申请退回的质押金到owner账户
 * @author liangyanxiang
 */
function candidateWithdraw() {
    const nodeId = config.nodeId //[64]byte 节点ID(公钥)

    const data = myContractInstance.CandidateWithdraw.getPlatONData(nodeId);
    const hash = web3.eth.sendRawTransaction(sign(wallet, password, getParams(data)))
    console.log('hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        if (code == 0) {
            let res = myContractInstance.decodePlatONLog(data.logs[0], 'CandidateWithdrawEvent');
            if (res.length && res[0]) {
                res = JSON.parse(res[0])
                if (res.ErrMsg == 'success') {
                    console.log(`节点质押金提取成功`);
                } else {
                    console.log(`节点质押金提取失败`);
                }
            } else {
                console.log(`节点质押金提取失败`)
            }
        } else {
            console.warn(`节点质押金提取异常`);
        }
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


function toObj(str) {
    if (!str || str == '0x') return []
    let result
    try {
        result = JSON.parse(str)
    } catch (error) {
        console.warn(`toObj error`, error)
        throw new Error(error)
    }
    if (Array.isArray(result)) {
        return result.map(item => {
            item.Extra ? item.Extra = JSON.parse(web3.toUtf8(item.Extra)): ''
            return item
        })
    } else {
        result.Extra ? result.Extra = JSON.parse(web3.toUtf8(result.Extra)) : ''
        return result
    }
}



module.exports = {
    getCandidateList,
    candidateDetails,
    candidateDeposit,
    verifiersList,
    candidateWithdrawInfos,
    setCandidateExtra,
    candidateApplyWithdraw,
    candidateWithdraw
}