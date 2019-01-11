var keythereum = require("keythereum");
var path = require("path");
var fs = require("fs-extra");
var createKeccakHash = require("keccak/js");
var os = require('os');
var secp256k1 = require("secp256k1/elliptic");
var sha3 = require('crypto-js/sha3');

var params = {
    keyBytes: 32,
    ivBytes: 16
};

var options = {
    kdf: "pbkdf2",
    cipher: "aes-128-ctr",
    kdfparams: {
        c: 1,
        dklen: 32,
        prf: "hmac-sha256"
    }
};

const DEFAULT_PATH = path.join(os.homedir(), 'keystores');

function keccak256(buffer) {
    return createKeccakHash("keccak256").update(buffer).digest();
}

function isFunction(f) {
    return typeof f === "function";
}

function c(err) {
    switch (err) {
        case null: return -100;
        case 1: return 0;
        case 0: return 1;
        default: return err;
    }
}

function getBLen(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        } else {
            len += 3;
        }
    }
    return len;
}

module.exports = {
    // 以下为文件证书函数
    browser: typeof process === "undefined" || !process.nextTick || Boolean(process.browser),
    setParams: function (_params) {
        params = _params;
    },
    getParams: function () {
        return params;
    },
    setOption: function (_options) {
        options = _options;
    },
    getOption: function () {
        return options;
    },
    createDk: function (cb) {
        err = 0;
        if (isFunction(cb)) {
            keythereum.create(this.getParams(), function (dk) {
                if (!dk) {
                    err = 1;
                }
                cb(err, dk);
            })
        } else {
            var dk = keythereum.create(this.getParams());
            return dk;
        }
    },
    // 获取key的文件名
    generateKeystoreFilename: function (keyObject) {
        var now = new Date().getTime().toString();
        filename = (keyObject.account || now) + '.json';

        return filename;
    },
    // 创建key
    createKey: function (account, username, password, cb) {
        var options = this.getOption();
        var err = 0;
        if (isFunction(cb)) {
            this.createDk(function (_err, dk) {
                err = _err;
                if (!err) {
                    keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options, function (keyObject) {
                        if (keyObject) {
                            keyObject.username = username;
                            keyObject.account = account;
                            keyObject.address = '0x' + keyObject.address;
                        } else {
                            err = 2;
                        }
                        cb(err, keyObject);
                    })
                } else {
                    cb(err, keyObject);
                }
            })
        } else {
            var dk = this.createDk();
            var keyObject = keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, options);
            keyObject.username = username;
            keyObject.account = account;
            keyObject.address = '0x' + keyObject.address;
            return keyObject;
        }
    },
    // 导出key到文件
    exportToFile: function (keyObject, keystore, outfileName, overWrite, cb) {
        keystore = keystore || DEFAULT_PATH;
        var err = 0;
        var outfileName = outfileName || this.generateKeystoreFilename(keyObject);
        var outpath = path.join(keystore, outfileName);
        var option = { spaces: 2 };
        var fileExist = fs.existsSync(outpath);

        if (isFunction(cb)) {
            if (fileExist && (!overWrite)) {
                err = 2;
                cb(err, null);
            } else {
                fs.outputJson(outpath, keyObject, option, err => {
                    if (!err) {
                        cb(0, outpath)
                    }
                })
            }
        } else {
            if (fileExist && (!overWrite)) {
                return null;
            } else {
                fs.outputJsonSync(outpath, keyObject, option);
                return outpath;
            }
        }
    },
    // 通过用户名，目录找到对应的key
    importFromAccount: function (account, keystore, cb) {
        keystore = keystore || DEFAULT_PATH;
        var filePath = path.join(keystore, account + '.json');
        return this.importFromFilePath(filePath, cb);
    },
    // 通过路径，找到对应的key
    importFromFilePath: function (filePath, cb) {
        if (isFunction(cb)) {
            fs.readJson(filePath, (err, keyObject) => {
                err = err ? 1 : 0;
                cb(err, keyObject);
            })
        } else {
            var keyObject = null;
            try {
                keyObject = fs.readJsonSync(filePath);
            } catch (e) {

            }
            return keyObject;
        }
    },
    // 获取某个目录下面的所有keys
    importFromDir: function (keystore, cb) {
        keystore = keystore || DEFAULT_PATH;
        var keyObjects = [];
        var self = this;
        if(!fs.existsSync(keystore)){
            if (isFunction(cb)) {
                cb(2, keyObjects);
            } else {
                return keyObjects;
            }
            return;
        };

        if (isFunction(cb)) {
            fs.readdir(keystore, function (err, files) {
                if (err || files.errno) {
                    console.log('readFile ' + keystore + ' error: ', err || files.errno);
                    cb(1, keyObjects);
                } else {
                    files = files.filter((file) => file.endsWith('.json'));
                    if (files.length === 0) {
                        cb(0, keyObjects);
                    }
                    var readCount = 0;
                    files.forEach(function (file, index) {
                        var filePath = path.join(keystore, file);
                        self.importFromFilePath(filePath, function (err, keyObject) {
                            readCount++;
                            if (err === 0) {
                                keyObjects.push(keyObject)
                            }
                            if (readCount === files.length) {
                                cb(0, keyObjects);
                            }
                        });
                    });
                }
            });
        } else {
            var files = fs.readdirSync(keystore);
            files = files.filter((file) => file.endsWith('.json'));
            files.forEach(function (file, index) {
                var filePath = path.join(keystore, file);
                var keyObject = self.importFromFilePath(filePath);
                if (keyObject) {
                    keyObjects.push(keyObject);
                }
            });
            return keyObjects;
        }
    },
    // 重置key
    resetPassword: function (oldPassword, newPassword, keyObject, cb) {
        function deepClone(o){
            return JSON.parse(JSON.stringify(o));
        }
        var self = this;
        if (isFunction(cb)) {
            self.recover(oldPassword, keyObject, function (err, privateKey) {
                if (privateKey) {
                    self.createDk(function (err, dk) {
                        if (dk) {
                            self.createKey(keyObject.account, keyObject.username, newPassword, function (err, newKeyObject) {
                                var newKey = deepClone(keyObject);
                                newKey.crypto = newKeyObject.crypto;
                                cb(err, newKey);
                            })
                        } else {
                            cb(err, null);
                        }
                    })
                } else {
                    cb(err, null);
                }
            });
        } else {
            var newKey = null;
            var privateKey = this.recover(oldPassword, keyObject);
            if (privateKey) {
                var dk = this.createDk();
                var newKeyObject = this.createKey(keyObject.account, keyObject.username, newPassword);
                if (newKeyObject) {
                    var newKey = deepClone(keyObject);
                    newKey.crypto = newKeyObject.crypto;
                }
            }
            return newKey;
        }
    },
    // 获取私钥privateKey
    recover: function (password, keyObject, cb) {
        var keyObjectCrypto, iv, salt, ciphertext, algo;
        var self = keythereum;
        var privateKey = '';
        keyObjectCrypto = keyObject.Crypto || keyObject.crypto;

        function verifyAndDecrypt(derivedKey, salt, iv, ciphertext, algo) {
            var key;
            if (self.getMAC(derivedKey, ciphertext) !== keyObjectCrypto.mac) {
                return null;
            }
            if (keyObject.version === "1") {
                key = keccak256(derivedKey.slice(0, 16)).slice(0, 16);
            } else {
                key = derivedKey.slice(0, 16);
            }
            return self.decrypt(ciphertext, key, iv, algo);
        }

        iv = self.str2buf(keyObjectCrypto.cipherparams.iv);
        salt = self.str2buf(keyObjectCrypto.kdfparams.salt);
        ciphertext = self.str2buf(keyObjectCrypto.ciphertext);
        algo = keyObjectCrypto.cipher;

        if (keyObjectCrypto.kdf === "pbkdf2" && keyObjectCrypto.kdfparams.prf !== "hmac-sha256") {
            if (!isFunction(cb)) {
                return null;
            } else {
                cb(2, null);
            }
        }

        if (!isFunction(cb)) {
            privateKey = verifyAndDecrypt(self.deriveKey(password, salt, keyObjectCrypto), salt, iv, ciphertext, algo);
            if (privateKey) {
                privateKey = privateKey.toString('hex');
            }
            return privateKey;
        } else {
            self.deriveKey(password, salt, keyObjectCrypto, function (derivedKey) {
                var err = 0;
                privateKey = verifyAndDecrypt(derivedKey, salt, iv, ciphertext, algo);
                if (!privateKey) {
                    err = 1;
                } else {
                    privateKey = privateKey.toString('hex');
                }
                cb(err, privateKey);
            });
        }
    },
    // 获取公钥
    getPublicKey: function (privateKey, cb) {
        var err = 0;
        if (typeof privateKey == 'string' && privateKey.constructor == String) {
            privateKey = Buffer.from(privateKey, 'hex');
        }
        var publicKey = null;
        try {
            publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);
        } catch (e) {
            err = 1;
        }
        if (publicKey) {
            publicKey = publicKey.toString('hex');
        }
        if (isFunction(cb)) {
            cb(err, publicKey);
        } else {
            return publicKey;
        }
    },

    // 导入keyObjects
    restoreKeys: function (srcDir, distDir, cb) {
        var err = 0;
        var copyFiles = [];
        distDir = distDir || DEFAULT_PATH;
        var option = {
            overwrite: false,
        }

        if(!fs.existsSync(srcDir)){
            if (isFunction(cb)) {
                cb(1, []);
            } else {
                return [];
            }
            return;
        };

        // 只拷贝一级目录且不存在目标路径的json文件。
        var srcFiles = [];
        var distFiles = [];
        try {
            srcFiles = fs.readdirSync(srcDir).filter((file) => fs.lstatSync(path.join(srcDir, file)).isFile());
        } catch (error) { }
        try {
            distFiles = fs.readdirSync(distDir).filter((file) => fs.lstatSync(path.join(distDir, file)).isFile());
        } catch (error) { }

        srcFiles = srcFiles.filter((file) => file.endsWith('.json'));
        srcFiles = srcFiles.filter((file) => distFiles.indexOf(file) < 0);

        var copyCount = 0;

        if (isFunction(cb)) {
            var copyCount = 0;
            srcFiles.forEach((file, index) => {
                var srcFilePath = path.join(srcDir, file);
                var distFilePath = path.join(distDir, file);
                fs.copy(srcFilePath, distFilePath, option, function (err) {
                    copyCount++;
                    if (!err) {
                        copyFiles.push(file);
                    }
                    if (copyCount === srcFiles.length) {
                        cb(0, copyFiles);
                    }
                })
            })
            if (srcFiles.length === 0) {
                cb(0, copyFiles);
            }
        } else {
            srcFiles.forEach((file, index) => {
                var srcFilePath = path.join(srcDir, file);
                var distFilePath = path.join(distDir, file);
                fs.copy(srcFilePath, distFilePath, option);
                copyFiles.push(file);
            })
            return copyFiles;
        }
    }
}