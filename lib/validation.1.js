/*
    用于验证platON客户端项目的竞选合约
*/
const Web3 = require('web3'),
    config = require('../config/config.json');

const lovelyLib = require('lovely-lib');

const wallet = require('../owner.json'),
    // encodeParams = require('../lib/encodeParams'),
    toObj=require('./toObj'),
    sign = require('./sign.simple'),
    abi = require('../abi/candidateConstract.json'),
    getTransactionReceipt = require('./getTransactionReceipt.1'),
    password = '88888888'

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log('balance:', web3.fromWei(balance));

const calcContract = web3.eth.contract(abi),
    candidateContract = calcContract.at(config.address.candidate);


/**
 * @description 节点候选人申请 / 增加质押;
 * @author liangyanxiang
 * @date 2018-11-29
 */
function candidateDeposit() {
    const privateKey = '099cad12189e848f70570196df434717c1ccc04f421da6ab651f38297a065cb7';

    let nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a', //[64]byte 节点ID(公钥)
        owner = wallet.address, //[20]byte 质押金退款地址
        fee = 500, //uint32 出块奖励佣金比，以10000为基数(eg：5 %，则fee = 500)
        { host, port } = config, //string 节点IP string 节点端口号
        Extra = JSON.stringify({
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

    Extra = web3.toUnicode(Extra);

    const data = candidateContract.CandidateDeposit.getPlatONData(nodeId, owner, fee, host, port, Extra, {
        transactionType:1001
    });

    const hash = web3.eth.sendRawTransaction(sign(privateKey, getParams(data, value)))
    console.log('hash', hash)

    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        if (code == 0) {
            let res = candidateContract.decodePlatONLog(data.logs[0]);
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
            console.warn(`节点候选人申请 / 增加质押异常`);
        }
    })
}

/**
 * @description 节点质押金退回申请，申请成功后节点将被重新排序
 * @author liangyanxiang
 * @date 2018-11-29
 */
function candidateApplyWithdraw() {
    const privateKey = '099cad12189e848f70570196df434717c1ccc04f421da6ab651f38297a065cb7';
    const nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a' //[64]byte 节点ID(公钥)

    const data = candidateContract.CandidateDeposit.getPlatONData(nodeId, {
        transactionType:1002
    });
    const hash = web3.eth.sendRawTransaction(
        sign(privateKey, getParams(data))
    );
    console.log('hash', hash);
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data);
        let res = candidateContract.decodePlatONLog(data.logs[0]);
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
 * @description 获取候选人信息 OK
 * @author liangyanxiang
 * @returns
 */
function candidateDetails() {
    const nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a' //[64]byte 节点ID(公钥)

    const data = candidateContract.CandidateDetails.getPlatONData(nodeId)

    const result = web3.eth.call({
        from: wallet.address,
        to: candidateContract.address,
        data: data,
    });

    const result1 = candidateContract.decodePlatONCall(result);
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
    const data = candidateContract.CandidateList.getPlatONData()

    const result = web3.eth.call({
        from: wallet.address,
        to: candidateContract.address,
        data: data,
    });

    const result1 = candidateContract.decodePlatONCall(result);

    const result2 = toObj(result1.data)
    console.log(`所有入围节点的信息列表:`, result2);
    return result2
}

/**
 * @description 获取参与当前共识的验证人列表 ok
 * @author liangyanxiang
 * @returns [] result2
 * @date 2018-11-30
 */
function verifiersList() {
    const data = candidateContract.VerifiersList.getPlatONData()

    const result = web3.eth.call({
        from: wallet.address,
        to: candidateContract.address,
        data: data,
    });

    const result1 = candidateContract.decodePlatONCall(result);
    const result2 = toObj(result1.data);
    console.log('获取参与当前共识的验证人列结果:', result2);
    return result2
}

/**
 * @description 获取节点申请的退款记录列表ok
 * @author liangyanxiang
 */
function candidateWithdrawInfos() {
    const nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a' //[64]byte 节点ID(公钥)
    const data = candidateContract.CandidateWithdrawInfos.getPlatONData(nodeId)

    const result = web3.eth.call({
        from: wallet.address,
        to: candidateContract.address,
        data: data,
    });

    const result1 = candidateContract.decodePlatONCall(result);
    const result2 = toObj(result1.data)
    console.log('获取节点申请的退款记录列表结果:', result2);
    return result2
}

/**
 * @description 设置节点附加信息，供前端扩展使用。
 * @author liangyanxiang
 */
function setCandidateExtra() {
    const privateKey = '099cad12189e848f70570196df434717c1ccc04f421da6ab651f38297a065cb7';
    let nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a', //[64]byte 节点ID(公钥)
        owner = wallet.address, //[20]byte 质押金退款地址
        time = Date.now(),
        Extra =JSON.stringify({
            nodeName: '节点名称',
            nodeDiscription: '节点简介' + time,
            nodeDepartment: '机构名称' + time,
            officialWebsite: 'www.platon.network',
            nodePortrait: 'URL',
            time: time, //加入时间
            owner, //节点退款地址
        }) //string 附加数据(有长度限制，限制值待定)

    Extra = web3.toUnicode(Extra);

    const data = candidateContract.SetCandidateExtra.getPlatONData(nodeId, Extra, {
        transactionType:1004
    });
    const hash = web3.eth.sendRawTransaction(sign(privateKey, getParams(data)))
    console.log('setCandidateExtra hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        let res = candidateContract.decodePlatONLog(data.logs[0]);
        if (res && res[0]) {
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
    const privateKey = '099cad12189e848f70570196df434717c1ccc04f421da6ab651f38297a065cb7';
    const nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a', //[64]byte 节点ID(公钥)
        withdraw = Number(web3.toWei(5, 'ether'));
    const data = candidateContract.CandidateApplyWithdraw.getPlatONData(nodeId, withdraw, {
        transactionType:1002
    });
    const hash = web3.eth.sendRawTransaction(sign(privateKey, getParams(data)))
    console.log('hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        if (code == 0) {
            let res = candidateContract.decodePlatONLog(data.logs[0], 'CandidateApplyWithdrawEvent');
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
    const privateKey = '099cad12189e848f70570196df434717c1ccc04f421da6ab651f38297a065cb7';
    const nodeId = '0xeebeaa496d954f8ee864e6460719755398f1e5b36e7a0c911f527fe3247b02a0a4db17aa59c5235e923602df1aeb26042149b8d2fd71cf990046b08d3b323b9a' //[64]byte 节点ID(公钥)
    const data = candidateContract.CandidateWithdraw.getPlatONData(nodeId, {
        transactionType:1003
    });
    const hash = web3.eth.sendRawTransaction(sign(privateKey, getParams(data)))
    console.log('hash', hash)
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
        if (code == 0) {
            let res = candidateContract.decodePlatONLog(data.logs[0], 'CandidateWithdrawEvent');
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
    const nonce = web3.eth.getTransactionCount(wallet.address);
    value = web3.toHex(web3.toWei(value, 'ether'));

    const params = {
        from: wallet.address,
        gasPrice: 22 * 10e9,
        gas: 80000,
        to: candidateContract.address,
        value,
        data,
        nonce
    }

    return params;
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