//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');
const model = require('./model.js');
const async = require('async');

function getVehicleDataParamTypes(req, res, next) {
    async.waterfall(
        [
            function(cb) {
                helper.getVehicleDataParamTypes(cb);
            },
        ],
        function(err, vehicle_data_types) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setStatus(500)
                    .setMessage('Internal server error')
                    .deliver();
            }
            const responseData = { vehicle_data_types: vehicle_data_types };
            return res.parcel
                .setStatus(200)
                .setData(responseData)
                .deliver();
        }
    );
}

function get(req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';

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
            const responseData = { custom_vehicle_data: custom_vehicle_data };
            return res.parcel
                .setStatus(200)
                .setData(responseData)
                .deliver();
        }
    );
}

/**
 * TODO validate parent_id is valid if given. Should be the most recent version.
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

    model.insertVehicleData(req.body, function(err, result) {
        if (err) {
            app.locals.log.error(err);
            res.parcel
                .setMessage('Internal server error')
                .setStatus(500);
        } else {
            const responseData = { custom_vehicle_data: result };
            res.parcel
                .setData(responseData)
                .setStatus(200);
        }
        res.parcel.deliver();
    });

}

/**
 * Promoting ids means.
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
            return res.parcel
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
    getVehicleDataParamTypes: getVehicleDataParamTypes,
    updateRpcSpec: helper.updateRpcSpec,
};
