/*
    用于验证platON客户端项目的票池合约
*/
const Web3 = require('web3'),
    config = require('../config/config.json'),
    jsSHA = require('jssha');

const wallet = require('../l666.json'),
    abi = require('../abi/ticketContract.json'),
    getTransactionReceipt = require('../lib/getTransactionReceipt'),
    sign = require('../lib/sign'),
    password = 'aa123456'

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log(`balance: %c ${web3.fromWei(balance)}`, "color:red");

const calcContract = web3.eth.contract(abi),
    ticketContract = calcContract.at(config.address.ticket);

/**
 * @description 购买选票，投票给候选人 发送交易的value为  购票数量 * 选票单价
 * @author liangyanxiang
 */
function voteTicket() {
    const
        count = 10,//购票数量
        price = 1,//选票单价 使用GetTicketPrice 接口查询当前票价
        nodeId = '0x4f6c8fd10bfb512793f81a3594120c76b6991d3d06c0cc652035cbfae3fcd7cdc3f3d7a82021dfdb9ea99f014755ec1a640d832a0362b47be688bb31d504f62d'//候选人节点Id

    const data = ticketContract.VoteTicket.getPlatONData(count, price, nodeId, {
        transactionType: 1000//交易类型
    });

    const value = price * count

    const hash = web3.eth.sendRawTransaction(
        sign(wallet, password, getParams(data, value))
    );
    console.log('hash', hash);
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data);
        let res = ticketContract.decodePlatONLog(data.logs[0]);
        if (res.length && res[0]) {
            res = JSON.parse(res[0]);
            if (res.ErrMsg == 'success') {
                if (res.Data) {
                    let num = res.Data - 0, ids = [];
                    for (let i = 0; i < num; i++) {
                        let ticketIndex = (i + '').charCodeAt(0).toString(16)
                        let str = txHash.replace(/^0x/, '') + ticketIndex;
                        var shaObj = new jsSHA("SHA3-256", "HEX");
                        shaObj.update(str);
                        let id = '0x' + shaObj.getHash("HEX");
                        ids.push(id);
                    }
                    console.log(ids)
                } else {
                    console.warn('没有票id')
                }
            } else {
                console.warn(`购买选票失败`);
            }
        } else {
            console.warn(`购买选票失败`);
        }
    });
}

/**
 * @description 获取票详情
 * @author liangyanxiang
 * @returns
 */
function getTicketDetail() {
    console.log('getTicketDetail')

    const ticketId = "0x134fba852817b9da8508f4b7e82e792be05b90f2a288e52df17c10da0f303b65"//票Id

    const data = ticketContract.GetTicketDetail.getPlatONData(ticketId)

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getBatchTicketDetail:', result1);
    return result1
}

/**
 * @description 批量获取票详情
 * @author liangyanxiang
 * @returns
 */
function getBatchTicketDetail() {
    console.log('getBatchTicketDetail')

    const ticketIds = "0x134fba852817b9da8508f4b7e82e792be05b90f2a288e52df17c10da0f303b65:0x9d1078cb595b669dc37501c4a6ed5bf98732d15ec083f4ad102b677ce62d07dc:0x036809aaa312a4414ffc0bfe9cdd1dadd9fd54725e1d8305fea8b39a566506e5:0xb0144ebd80ee817902185da65c23daa16eeceb339125ce889841925e928963ad:0x80d8bab01789f512d9d8b060609009276bf0a6b101b19989c3946e51049708fb:0x861c9a791df9d03b54471f7fd21c9e996cbaf6f6f885e47f1a20f204156ada88:0x294b2baae5f9445363436ff2cffaeff63baf536c5d21fd17b25ba0f79c30aacb:0xc8d43bf85d4a9c63198439a6c282a0b308cbb0e2102493c34640afc998f3a1ef"//票Id列表 多张票的Id 通过:拼接 string

    const data = ticketContract.GetBatchTicketDetail.getPlatONData(ticketIds)

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getBatchTicketDetail:', result1);
    return result1
}

/**
 * @description 获取指定候选人的选票Id的列表
 * @author liangyanxiang
 */
function getCandidateTicketIds() {
    console.log('getCandidateTicketIds')

    const nodeId = '0x4f6c8fd10bfb512793f81a3594120c76b6991d3d06c0cc652035cbfae3fcd7cdc3f3d7a82021dfdb9ea99f014755ec1a640d832a0362b47be688bb31d504f62d'//候选人节点Id

    const data = ticketContract.GetCandidateTicketIds.getPlatONData(nodeId)

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getCandidateEpoch result:', result1);
    return result1
}

/**
 * @description 批量获取指定候选人的选票Id的列表
 * @author liangyanxiang
 */
function getBatchCandidateTicketIds() {
    console.log('getBatchCandidateTicketIds')
    const nodeIds = '0x4f6c8fd10bfb512793f81a3594120c76b6991d3d06c0cc652035cbfae3fcd7cdc3f3d7a82021dfdb9ea99f014755ec1a640d832a0362b47be688bb31d504f62d:0x01d033b5b07407e377a3eb268bdc3f07033774fb845b7826a6b741430c5e6b719bda5c4877514e8052fa5dbc2f20fb111a576f6696b6a16ca765de49e11e0541'//多个nodeId通过":"拼接的字符串

    const data = ticketContract.GetBatchCandidateTicketIds.getPlatONData(nodeIds)

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getBatchCandidateTicketIds result:', result1);
    return result1
}

/**
 * @description 获取指定候选人的票龄
 * @author liangyanxiang
 */
function getCandidateEpoch() {
    console.log('getCandidateEpoch')
    const nodeId = '0x4f6c8fd10bfb512793f81a3594120c76b6991d3d06c0cc652035cbfae3fcd7cdc3f3d7a82021dfdb9ea99f014755ec1a640d832a0362b47be688bb31d504f62d'//候选人节点Id

    const data = ticketContract.GetCandidateEpoch.getPlatONData(nodeId)

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getCandidateEpoch result:', result1);
    return result1
}

/**
 * @description 获取票池剩余票数量
 * @author liangyanxiang
 */
function getPoolRemainder() {
    console.log('getPoolRemainder')
    const data = ticketContract.GetPoolRemainder.getPlatONData()

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getPoolRemainder result:', result1);
    return result1
}

/**
 * @description 获取当前的票价
 * @author liangyanxiang
 */
function getTicketPrice() {
    console.log('getTicketPrice')

    const data = ticketContract.GetTicketPrice.getPlatONData()

    const result = web3.eth.call({
        from: wallet.address,
        to: ticketContract.address,
        data: data,
    });

    const result1 = ticketContract.decodePlatONCall(result);
    console.log('getTicketPrice result:', result1);
    return result1
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
    // value = web3.toHex(web3.toWei(value, 'ether'));
    value = web3.toHex(value)

    const params = {
        from: wallet.address,
        gasPrice: 22 * 10e9,
        gas: 80000,
        to: ticketContract.address,
        value,
        data,
        nonce
    }

    return params;
}

module.exports = {
    voteTicket,
    getTicketDetail,
    getBatchTicketDetail,
    getCandidateTicketIds,
    getBatchCandidateTicketIds,
    getCandidateEpoch,
    getPoolRemainder,
    getTicketPrice
}