
const keyManager = require('key-manager'),
    Tx = require('ethereumjs-tx');

module.exports = (keyObject, passWord, data) => {
    const privateKey = keyManager.recover(passWord, keyObject);
    const key = new Buffer(privateKey, 'hex')
    const tx = new Tx(data)
    tx.sign(key)

    const serializeTx = tx.serialize()
    const result = '0x' + serializeTx.toString('hex')
    return result
}