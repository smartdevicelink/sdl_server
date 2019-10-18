//Copyright (c) 2018, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');
const model = require('./model.js');
const flow = app.locals.flow;
const cache = require('../../../custom/cache');
const certificates = require('../certificates/controller');
const certUtil = require('../helpers/certificates.js');

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

    if (req.body.private_key && req.body.certificate) {
        // while the pkcs12 is not used, this is necessary to check that the private key and certificate match
        certUtil.isCertificateExpired(req.body.certificate, function(err, isExpired) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel
                    .setMessage('An error occurred when processing the private key and certificate data. If you are providing your own, please be certain of their accuracy and validity.')
                    .setStatus(500)
                    .deliver();
            }
            if (isExpired) {
                return res.parcel
                    .setMessage('Certificate is expired')
                    .setStatus(400)
                    .deliver();
            }

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

module.exports = {
    get: get,
    post: post.bind(null, false),
    promote: post.bind(null, true)
};
