//Copyright (c) 2018, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');
const model = require('./model.js');
const sql = require('./sql.js');
const cache = require('../../../custom/cache');
const certUtil = require('../helpers/certificates');
const certController = require('../certificates/controller');
const db = app.locals.db;
const flow = app.locals.flow;
const async = require('async');
const sqlBricks = require('sql-bricks-postgres');

async function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';

    try {
        let data;

        if (req.query.id) { //get module config of a specific id
            if (Number.isNaN(Number(req.query.id))) {
                return res.parcel.setStatus(400).setMessage("id must be an integer").deliver();
            }
            data = await helper.getModuleConfig('id', req.query.id);
        } else { //get the most recent module config object
            data = await helper.getModuleConfig('status', isProduction);
        }
        if (!certController.openSSLEnabled) { // cert gen not enabled
            data.forEach(obj => {
                delete obj.certificate;
                delete obj.private_key
            });
        }
        return res.parcel
            .setStatus(200)
            .setData(
                {
                    'module_configs': data
                }
            )
            .deliver();
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage('Internal server error')
            .deliver();
    }       
}

async function post (isProduction, req, res, next) {
    helper.validatePost(req, res);
    if (res.parcel.message) {
        app.locals.log.error(res.parcel.message);
        return res.parcel.deliver();
    }

    if (certController.openSSLEnabled && req.body.private_key && req.body.certificate) {
        let expirationDate;
        try {
            expirationDate = await certUtil.extractExpirationDateCertificate(req.body.certificate);
        } catch (err) {
            app.locals.log.error(err);
            return res.parcel
                .setMessage('An error occurred when processing the private key and certificate data. If you are providing your own, please be certain of their accuracy and validity.')
                .setStatus(400)
                .deliver();
        }

        if (expirationDate < Date.now()) { //expired cert
            return res.parcel
                .setMessage('Certificate is expired')
                .setStatus(400)
                .deliver();
        }
        //the expiration date is valid. add it to the module config body for storage in the DB
        req.body.expiration_ts = expirationDate;

        try {
            // while the keyCertBundle is not used, this is necessary to check that the private key and certificate match
            await certUtil.createKeyCertBundle(req.body.private_key, req.body.certificate);
        } catch (err) {
            app.locals.log.error(err);
            return res.parcel.setStatus(500)
                .setMessage('An error occurred in creating the certificate')
                .deliver();
        }
    }
    // save the data
    try {
        await model.insertModuleConfig(isProduction, req.body);
        cache.deleteCacheData(isProduction, app.locals.version, cache.policyTableKey);
        res.parcel.setStatus(200);
        res.parcel.deliver();
    } catch (err) {
        app.locals.log.error(err);
        res.parcel
            .setMessage('Interal server error')
            .setStatus(500);
        res.parcel.deliver();
    }
}

async function promoteNoId (req, res, next) {
    if (res.parcel.message) {
        return res.parcel.deliver();
    }

    // retrieve the staging config
    try {
        const data = await helper.getModuleConfig('status', false);
        if (!certController.openSSLEnabled) { // cert gen not enabled
            data.forEach(obj => {
                delete obj.certificate;
                delete obj.private_key
            });
        }
        // modify the body and pass the express parameters along as if we are posting to production
        req.body = data[0];
        post(true, req, res, next);
    } catch (err) {
        app.locals.log.error(err);
        return res.parcel
            .setStatus(500)
            .setMessage('Internal server error')
            .deliver();
    }
}

async function checkAndUpdateCertificate () {
    if (!certController.openSSLEnabled) {
        return;
    }

    const expiredModuleConfigs = await db.asyncSql(sql.getAllExpiredModuleCertificates());

    for (let moduleConfig of expiredModuleConfigs) {
        //cert expired. make a new one and add the new module config to the database
        app.locals.log.info("creating new module config cert");

        //use the existing private key to make a new cert
        let options = certController.getCertificateOptions({
            clientKey: moduleConfig.private_key
        });

        const keyBundle = await certController.asyncCreateCertificate(options);

        //new cert created! extract the key and cert and save the module config with them
        moduleConfig.certificate = keyBundle.certificate;
        moduleConfig.private_key = keyBundle.clientKey;

        const newExpDate = await certUtil.extractExpirationDateCertificate(keyBundle.certificate);
        //the expiration date is valid. add it to the module config body for storage in the DB
        moduleConfig.expiration_ts = newExpDate;

        const updateObj = {
            certificate: moduleConfig.certificate,
            private_key: moduleConfig.private_key,
            expiration_ts: moduleConfig.expiration_ts,
            updated_ts: sqlBricks('now()'),
        };

        cache.deleteCacheData(true, app.locals.version, cache.policyTableKey);
        cache.deleteCacheData(false, app.locals.version, cache.policyTableKey);
        await db.asyncSql(sql.updateModuleConfig(moduleConfig.id, updateObj));
    }
    app.locals.log.info("Module certificates updated");
}

module.exports = {
    get: get,
    post: post.bind(null, false),
    promote: post.bind(null, true),
    promoteNoId: promoteNoId,
    checkAndUpdateCertificate: checkAndUpdateCertificate
};
