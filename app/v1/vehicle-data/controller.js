//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');
const cache = require('../../../custom/cache');

async function get (req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';
    const returnTemplate = !!req.query.template; //coerce to boolean

    if (returnTemplate) {
        return getTemplate(req, res);
    }

    if (req.query.id && Number.isNaN(Number(req.query.id))) {
        return res.parcel.setStatus(400).setMessage("id must be an integer").deliver();
    }

    try {
        const custom_vehicle_data = await helper.getVehicleData(isProduction, req.query.id);
        return res.parcel
            .setStatus(200)
            .setData({
                custom_vehicle_data: custom_vehicle_data
            })
            .deliver();
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage('Internal server error')
            .deliver();
    }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {*|void}
 */
async function post (req, res, next) {
    helper.validatePost(req, res);
    if (res.parcel.message) {
        app.locals.log.error(res.parcel.message);
        return res.parcel.deliver();
    }

    try {
        const result = await app.locals.db.asyncTransaction(async client => {
            return await helper.insertCustomVehicleDataItem(client, req.body);
        });

        cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
        const responseData = {
            custom_vehicle_data: [result]
        };

        return res.parcel
            .setData(responseData)
            .setStatus(200)
            .deliver();

    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage('Internal server error')
            .deliver();
    }
}

/**
 * @param req
 * @param res
 * @param next
 * @returns {*|void}
 */
async function promote (req, res, next) {
    try {
        await helper.promote();
        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        return res.parcel
            .setStatus(200)
            .deliver();
    } catch (err) {
        app.locals.log.error(err);
            return res.parcel
                .setStatus(500)
                .setMessage('Internal server error')
                .deliver();
    }
}

async function getValidTypes (req, res) {
    try {
        const data = await helper.getValidTypes();
        return res.parcel
            .setData({
                type: data
            })
            .setStatus(200)
            .deliver();
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage('Internal server error')
            .deliver();
    }
}

async function getTemplate (req, res) {
    try {
        const templateData = await helper.getTemplate();
        return res.parcel
            .setData({
                custom_vehicle_data: [templateData]
            })
            .setStatus(200)
            .deliver();
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage('Internal server error')
            .deliver();
    }
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
