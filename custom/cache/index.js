const config = require('../../settings');
const log = require('../../custom/loggers/winston');
var cache
try {
    cache = require(`./${config.cacheModule}`);
} catch (e) {
    log.error('There is no cache available. Please make sure the configuration for it is setup correctly.');
}

const policyTableKey = 'policyTableKey';

function getCacheData(isProduction, key, callback) {
    if (cache) {
        cache.get(makeKey(isProduction, key), callback);
    } else {
        callback(null, null);
    }
};

function setCacheData(isProduction, key, value, callback) {
    if (cache) {
        cache.set(makeKey(isProduction, key), value, callback);
    } else if (callback) {
        callback(null, null);
    }
};

function deleteCacheData(isProduction, key, callback) {
    if (cache) {
        cache.del(makeKey(isProduction, key), callback);
    } else if (callback) {
        callback(null, null);
    }
};

function makeKey(isProduction, key) {
    return isProduction ? 'production/' + key : 'staging/' + key;
};

module.exports = {
    getCacheData: getCacheData,
    setCacheData: setCacheData,
    deleteCacheData: deleteCacheData,
    policyTableKey: policyTableKey
};
