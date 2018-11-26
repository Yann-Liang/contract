var Int64 = require('node-int64');
var rlp = require('rlp');

module.exports = function (sendType, types, params) {
    var type = new Int64(sendType), buf1 = type.toBuffer(), arr = [buf1];

    types.map(function (item, index) {
        switch (item) {
            case 'string':
            case 'buffer':
            case 'address':
                arr.push(Buffer.from(params[index]));
                break;
            case 'int32':
                var buf = Buffer.alloc(4);
                buf.writeInt32BE(params[index], 0);
                arr.push(buf);
                break;
            case 'uint64':
                var buf = Uint64be.encode(params[index]);
                arr.push(buf);
                break;
            case 'hex':
                arr.push(Buffer.from(params[index],'hex'))
                break;
            default:
                arr.push(Buffer.from(params[index]));
                break;
        }
    });

    var encode = rlp.encode(arr),
        result = encode.toString('hex');
    return result;
};
