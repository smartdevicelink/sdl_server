const config = require('../../settings');
const log = require('../../custom/loggers/winston');
var cache
try {
    cache = require(`./${config.cacheModule}`);
} catch (e) {
    log.error('There is no cache available. If you are using one, please make sure the configuration for it is set up correctly.');
}

const policyTableKey = 'policyTableKey';

function getCacheData(isProduction, version, key, callback) {
    if (cache) {
        cache.get(makeKey(isProduction, version, key), callback);
    } else {
        callback(null, null);
    }
};

function setCacheData(isProduction, version, key, value, callback) {
    if (cache) {
        cache.set(makeKey(isProduction, version, key), value, callback);
    } else if (callback) {
        callback(null, null);
    }
};

function deleteCacheData(isProduction, version, key, callback) {
    if (cache) {
        cache.del(makeKey(isProduction, version, key), callback);
    } else if (callback) {
        callback(null, null);
    }
};

function flushAll(callback) {
    if (cache) {
        cache.flushall(callback);
    } else if (callback) {
        callback(null, null);
    }
};

function makeKey(isProduction, version, key) {
    return isProduction ? version + '/production/' + key : version + '/staging/' + key;
};

module.exports = {
    getCacheData: getCacheData,
    setCacheData: setCacheData,
    deleteCacheData: deleteCacheData,
    flushAll: flushAll,
    policyTableKey: policyTableKey
};
