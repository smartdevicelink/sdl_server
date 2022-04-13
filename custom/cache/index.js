const config = require('../../settings');
const log = require('../../custom/loggers/winston');
const promisify = require('util').promisify;
var cache
try {
    cache = require(`./${config.cacheModule}`);
} catch (e) {
    log.error('There is no cache available. If you are using one, please make sure the configuration for it is set up correctly.');
}

const policyTableKey = 'policyTableKey';

async function getCacheData (isProduction, version, key) {
    if (cache) {
        return await promisify(cache.get)(makeKey(isProduction, version, key));
    }
    return null;
};

async function setCacheData (isProduction, version, key, value) {
    if (cache) {
        return await promisify(cache.set)(makeKey(isProduction, version, key), value);
    } 
    return null;
};

async function deleteCacheData (isProduction, version, key) {
    if (cache) {
        return await promisify(cache.del)(makeKey(isProduction, version, key));
    }
    return null;
};

async function flushAll () {
    if (cache) {
        return await promisify(cache.flushall)();
    }
    return null;
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
