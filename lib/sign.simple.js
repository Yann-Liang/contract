
const Tx = require('ethereumjs-tx');

module.exports = (privateKey, data) => {
    if (!privateKey || !data) {
        throw new Error(`sign参数异常`);
    }

    const key = new Buffer(privateKey, 'hex'),
        tx = new Tx(data);

    tx.sign(key);

    const serializeTx = tx.serialize(),
        result = '0x' + serializeTx.toString('hex');

    return result;
};