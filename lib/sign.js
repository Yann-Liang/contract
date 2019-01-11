
const keyManager = require('./key-manager'),
    Tx = require('ethereumjs-tx');

module.exports = (keyObject, passWord, data) => {
    if (!keyObject || !passWord || !data) {
        throw new Error(`sign参数异常`)
    }
    const privateKey = keyManager.recover(passWord, keyObject);
    console.log('privateKey=', privateKey)
    const key = new Buffer(privateKey, 'hex')
    const tx = new Tx(data)
    tx.sign(key)

    const serializeTx = tx.serialize()
    const result = '0x' + serializeTx.toString('hex')
    return result
}