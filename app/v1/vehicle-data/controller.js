//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');
const async = require('async');
const cache = require('../../../custom/cache');

function get(req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';
    const returnTemplate = !!req.query.template; //coerce to boolean

    if (returnTemplate) {
        return getTemplate(req, res);
    }

    if (req.query.id && Number.isNaN(Number(req.query.id))) {
        return res.parcel.setStatus(400).setMessage("id must be an integer").deliver();
    }

    async.waterfall(
        [
            function(cb) {
                helper.getVehicleData(isProduction, req.query.id, cb);
            },
        ],
        function(err, custom_vehicle_data) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setStatus(500)
                    .setMessage('Internal server error')
                    .deliver();
            }
            const responseData = {
                custom_vehicle_data: custom_vehicle_data
            };
            return res.parcel
                .setStatus(200)
                .setData(responseData)
                .deliver();
        }
    );
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {*|void}
 */
function post(req, res, next) {
    helper.validatePost(req, res);
    if (res.parcel.message) {
        app.locals.log.error(res.parcel.message);
        return res.parcel.deliver();
    }

    async.waterfall(
        [
            function(cb) {
                app.locals.db.runAsTransaction(function(client, callback) {
                    helper.insertCustomVehicleDataItem(client, req.body, callback);
                }, cb);
            },
        ],
        function(err, result) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setStatus(500)
                    .setMessage('Internal server error')
                    .deliver();
            }
            cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
            const responseData = {
                custom_vehicle_data: [result]
            };

            return res.parcel
                .setData(responseData)
                .setStatus(200)
                .deliver();
        }
    );

}

/**
 * @param req
 * @param res
 * @param next
 * @returns {*|void}
 */
function promote(req, res, next) {

    async.waterfall(
        [
            function(cb) {
                helper.promote(cb);
            },
        ],
        function(err) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setStatus(500)
                    .setMessage('Internal server error')
                    .deliver();
            }
            cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
            return res.parcel
                .setStatus(200)
                .deliver();
        }
    );

}

function getValidTypes(req, res) {
    async.waterfall(
        [
            function(cb) {
                helper.getValidTypes(cb);
            },
        ],
        function(err, data) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setStatus(500)
                    .setMessage('Internal server error')
                    .deliver();
            }
            const responseData = {
                type: data
            };
            return res.parcel
                .setData(responseData)
                .setStatus(200)
                .deliver();
        }
    );
}

function getTemplate(req, res) {
    async.waterfall(
        [
            function(cb) {
                helper.getTemplate(cb);
            },
        ],
        function(err, templateData) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setStatus(500)
                    .setMessage('Internal server error')
                    .deliver();
            }
            const responseData = {
                custom_vehicle_data: [templateData]
            };
            return res.parcel
                .setData(responseData)
                .setStatus(200)
                .deliver();
        }
    );
}

module.exports = {
    get: get,
    post: post,
    promote: promote,
    updateVehicleDataEnums: helper.updateVehicleDataEnums,
    updateRpcSpec: helper.updateRpcSpec,
    getValidTypes: getValidTypes,
    getTemplate: getTemplate,
};
