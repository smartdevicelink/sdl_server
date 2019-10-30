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

function get(req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';

    let chosenFlow;

    if (req.query.id) { //get module config of a specific id
        chosenFlow = helper.getModuleConfigFlow('id', req.query.id);
    } else { //get the most recent module config object
        chosenFlow = helper.getModuleConfigFlow('status', isProduction);
    }

    chosenFlow(function(err, data) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel
                .setStatus(500)
                .setMessage('Internal server error')
                .deliver();
        }
        return res.parcel
            .setStatus(200)
            .setData(
                {
                    'module_configs': data
                }
            )
            .deliver();
    });
}

function post(isProduction, req, res, next) {
    helper.validatePost(req, res);
    if (res.parcel.message) {
        app.locals.log.error(res.parcel.message);
        return res.parcel.deliver();
    }

    if (certController.openSSLEnabled && req.body.private_key && req.body.certificate) {
        certUtil.extractExpirationDateCertificate(req.body.certificate, function (err, expirationDate) {
            if (err) {
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

            // while the keyCertBundle is not used, this is necessary to check that the private key and certificate match
            certUtil.createKeyCertBundle(req.body.private_key, req.body.certificate)
                .then(keyCertBundle => {
                    saveModuleConfig(); //save here
                })
                .catch(err => {
                    app.locals.log.error(err);
                    return res.parcel.setStatus(500)
                        .setMessage('An error occurred in creating the certificate')
                        .deliver();
                });
        });
    }
    else {
        saveModuleConfig(); //save here
    }

    function saveModuleConfig () {
        model.insertModuleConfig(isProduction, req.body, function (err) {
            if (err) {
                app.locals.log.error(err);
                res.parcel
                    .setMessage('Interal server error')
                    .setStatus(500);
            } else {
                cache.deleteCacheData(isProduction, app.locals.version, cache.policyTableKey);
                res.parcel.setStatus(200);
            }
            res.parcel.deliver();
        });
    }
}

function checkAndUpdateCertificate (cb) {
    if (!certController.openSSLEnabled) {
        if (cb) {
            cb();
        }
        return;
    }

    db.sqlCommand(sql.getAllExpiredModuleCertificates(), certCheckAndUpdateModuleConfigs);

    function certCheckAndUpdateModuleConfigs (err, expiredModuleConfigs) {
        if (err) {
            app.locals.log.error(err);
            if (cb) {
                cb();
            }
            return;
        }

        async.mapSeries(expiredModuleConfigs, function (moduleConfig, next) {
            //cert expired. make a new one and add the new module config to the database
            app.locals.log.info("creating new module config cert");

            //use the existing private key to make a new cert
            let options = certController.getCertificateOptions({
                clientKey: moduleConfig.private_key
            });

            certController.createCertificateFlow(options, function (err, keyBundle) {
                if (err) {
                    app.locals.log.error(err);
                    return next();
                }

                //new cert created! extract the key and cert and save the module config with them
                moduleConfig.certificate = keyBundle.certificate;
                moduleConfig.private_key = keyBundle.clientKey;

                certUtil.extractExpirationDateCertificate(keyBundle.certificate, function (err, newExpDate) {
                    if (err) {
                        app.locals.log.error(err);
                        return next();
                    }
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
                    db.sqlCommand(sql.updateModuleConfig(moduleConfig.id, updateObj), next);
                });
            });
        }, function (err) {
            if (err) {
                app.locals.log.error(err);
            }
            if (cb) {
                cb();
            }
        });
    }
}

module.exports = {
    get: get,
    post: post.bind(null, false),
    promote: post.bind(null, true),
    checkAndUpdateCertificate: checkAndUpdateCertificate
};
