const config = require('../../../settings.js');
const log = require('../../loggers/winston');
const Redis = require('redis');
var redis;
try {
    redis = Redis.createClient({
        port: config.cacheModulePort,
        host: config.cacheModuleHost,
        password: config.cacheModulePassword
    });
} catch (e) {
    log.error('Cannot connect to Redis. Please check that your configuration is correct.');
}


exports.get = function (key, callback) {
    if (!redis) {
        if (callback) {
            callback(null, null);
        }
        return;
    }

    redis.get(key, function (err, reply) {
        if (!reply) {
            callback(err, null);
            return;
        }

        try {
            var object = JSON.parse(reply);
            callback(null, object);
        } catch (e) {
            callback(null, null);
        }
    })
};

exports.set = function (key, value, callback) {
    if (!redis) {
        if (callback) {
            callback(null, null);
        }
        return;
    }
    redis.set(key, JSON.stringify(value), callback);
};

exports.del = function (key, callback) {
    if (!redis) {
        if (callback) {
            callback(null, null);
        }
        return;
    }
    redis.del(key, callback);
};

exports.flushall = function (callback) {
    if (!redis) {
        if (callback) {
            callback(null, null);
        }
        return;
    }
    redis.flushall(callback);
};
