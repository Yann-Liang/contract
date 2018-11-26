const Web3 = require('web3');

const wallet = require('./l666.json'),
    abi = require('./abi/candidateConstract.json'),
    encodeParams = require('./lib/encodeParams'),
    keyManager = require('key-manager'),
    Tx=require('ethereumjs-tx');

const rlp = require('rlp');

const provider = 'http://10.10.8.242:8545';
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
console.log(web3);

const balance = web3.eth.getBalance(wallet.address).toNumber();

console.log('balance:', balance);

const calcContract = web3.eth.contract(abi);

const myContractInstance = calcContract.at(
    `0x1000000000000000000000000000000000000001`
);

const nodeId = 'e152be5f5f0167250592a12a197ab19b215c5295d5eb0bb1133673dc8607530db1bfa5415b2ec5e94113f2fce0c4a60e697d5d703a29609b197b836b020446c7',
    data1 = myContractInstance.CandidateDetails.getPlatONData(nodeId),
    data =
        '0x' + encodeParams(4, ['string', 'hex'], ['CandidateDetails', nodeId]);

// const data2 = '0xf89d8800000000000000049043616e64696461746544657461696c73b8816531353262e152be5f5f0167250592a12a197ab19b215c5295d5eb0bb1133673dc8607530db1bfa5415b2ec5e94113f2fce0c4a60e697d5d703a29609b197b836b020446c7'

const result = web3.eth.call({
    from: wallet.address,
    to: myContractInstance.address,
    data: data,
});

console.log('platONCall result:', result);
myContractInstance.decodePlatONCall (result);



// data =
//         '0x' + encodeParams(4, ['string', 'hex'], ['CandidateDetails', nodeId]);

// console.log('data', data)

// const decode = rlp.decode(data)

function sendTransaction() {
    const account = web3.eth.accounts[0]
    web3.personal.unlockAccount(account, '11111111', 9999999)

    console.log(`--sendTransaction start--`)

    const platOnData = data

    // const contractData = myContractInstance.transfer.getData(param_from, param_to, param_assert)
    //nonce：sendTransaction可以不传，sendRowTransaction必须传
    const params = {
        from: account,
        gasPrice: '0x8250de00',
        gas: '0x706709',
        to: myContractInstance.address,
        value: "0x0",
        data: platOnData,
    }
    console.log(`testTransfer params:\n`, JSON.stringify(params))
    const hash = web3.eth.sendTransaction(params)
    console.log(`platONSendTransaction hash:`, hash);
    getTransactionReceipt(hash, (code, data) => {
        console.log(code, data)
    })
}

function sendRawTransaction() {
    console.log(`--sendRawTransaction start--`)
    const account=wallet.address
    const platOnData = data

    const nonce = web3.eth.getTransactionCount(account)



    // const contractData = myContractInstance.transfer.getData(param_from, param_to, param_assert)
    //nonce：sendTransaction可以不传，sendRowTransaction必须传
    const params = {
        from: wallet.address,
        gasPrice: '0x8250de00',
        gas: '0x706709',
        to: myContractInstance.address,
        value: "0x0",
        data: platOnData,
        nonce
    }
    console.log(`sendRawTransaction params:\n`, JSON.stringify(params))

    const privateKey = keyManager.recover('aa123456', wallet);
    console.log(privateKey)
    const key=new Buffer(privateKey,'hex')
    let tx=new Tx(params)
    tx.sign(key)

    let serializeTx= tx.serialize()
    const hash = web3.eth.sendRawTransaction ('0x'+serializeTx.toString('hex'));
    console.log (`sendRawTransaction hash:`, hash);
    getTransactionReceipt (hash, (code, data) => {
    console.log (code, data);
    });



}

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

sendRawTransaction()

console.log('end')