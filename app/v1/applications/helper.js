const check = require('check-types');
const app = require('../app');
const model = require('./model.js');
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const flow = app.locals.flow;
const flame = app.locals.flame;
const log = app.locals.log;
const db = app.locals.db;
const config = app.locals.config;
const async = require('async');
const certificates = require('../certificates/controller.js');
const certUtil = require('../helpers/certificates.js');

//validation functions
function checkIdIntegerBody (req, res) {
    if (Number.isNaN(Number(req.body.id))) {
        res.parcel.setStatus(400).setMessage("id must be an integer");
    }
    return;
}

function validateActionPost (req, res) {
	if (!req.body.id || !req.body.approval_status) {
		res.parcel.setStatus(400).setMessage("Id and approval status required");
	} else if (req.body.approval_status !== 'PENDING'
		&& req.body.approval_status !== 'STAGING'
        && req.body.approval_status !== 'ACCEPTED'
		&& req.body.approval_status !== 'LIMITED') {
			res.parcel.setStatus(400).setMessage("Invalid approval status value");
	}
	return;
}

function validateServicePermissionPut (req, res) {
	if (!req.body.id || !check.boolean(req.body.is_selected) || !check.string(req.body.service_type_name) || !check.string(req.body.permission_name)) {
		res.parcel.setStatus(400).setMessage("id, is_selected, service_type_name, and permission_name are required");
	}
    return;
}

function validateFunctionalGroupPut (req, res) {
	if (!req.body.app_id || !check.boolean(req.body.is_selected) || !check.string(req.body.property_name)) {
		res.parcel.setStatus(400).setMessage("app_id, is_selected, and property_name are required");
	}
    return;
}

function validateHybridPost (req, res) {
	if (!check.string(req.body.uuid) || !check.includes(["CLOUD","MOBILE","BOTH"], req.body.hybrid_preference)) {
		res.parcel.setStatus(400).setMessage("uuid and a valid hybrid_preference are required");
	}
    return;
}

function validateAutoPost (req, res) {
	if (!check.string(req.body.uuid) || !check.boolean(req.body.is_auto_approved_enabled)) {
		res.parcel.setStatus(400).setMessage("Uuid and auto approved required");
	}
    return;
}

function validateRPCEncryptionPut (req, res) {
	if (!req.body.id || !check.boolean(req.body.encryption_required)) {
		res.parcel.setStatus(400).setMessage("id and encryption_required required");
	}
    return;
}

function validateAdministratorPost (req, res) {
	if (!check.string(req.body.uuid) || !check.boolean(req.body.is_administrator_app)) {
		res.parcel.setStatus(400).setMessage("uuid and is_administrator_app required");
	}
    return;
}

function validatePassthroughPost (req, res) {
	if (!check.string(req.body.uuid) || !check.boolean(req.body.allow_unknown_rpc_passthrough)) {
		res.parcel.setStatus(400).setMessage("uuid and allow_unknown_rpc_passthrough required");
	}
    return;
}

function validateUpdateAppCertificate (req, res) {
    if (!req.body.options ||
        !check.string(req.body.options.app_uuid) ||
        !check.string(req.body.options.clientKey) ||
        !check.string(req.body.options.certificate)
    ) {
        res.parcel.setStatus(400).setMessage("options object with app_uuid, clientKey and certificate required");
    }
    return;
}

function validateWebHook (req, res) {
	if(req.headers["public_key"] != app.locals.config.shaidPublicKey){
		// request cannot be verified as authentic
        res.parcel.setStatus(401).setMessage("Unable to validate webhook with SHAID public key");
	}
	return;
}

//helper functions

//gets back app information depending on the filters passed in
function createAppInfoFlow (filterTypeFunc, value) {
	const getAppFlow = app.locals.flow({
		appBase: setupSql.bind(null, sql.getApp.base[filterTypeFunc](value)),
		appCountries: setupSql.bind(null, sql.getApp.countries[filterTypeFunc](value)),
		appDisplayNames: setupSql.bind(null, sql.getApp.displayNames[filterTypeFunc](value)),
		appPermissions: setupSql.bind(null, sql.getApp.permissions[filterTypeFunc](value)),
        appCategories: setupSql.bind(null, sql.getApp.category[filterTypeFunc](value)),
		appAllCategories: setupSql.bind(null, sql.getApp.allCategories[filterTypeFunc](value)),
		appServiceTypes: setupSql.bind(null, sql.getApp.serviceTypes[filterTypeFunc](value)),
		appServiceTypeNames: setupSql.bind(null, sql.getApp.serviceTypeNames[filterTypeFunc](value)),
		appServiceTypePermissions: setupSql.bind(null, sql.getApp.serviceTypePermissions[filterTypeFunc](value)),
		appAutoApprovals: setupSql.bind(null, sql.getApp.autoApproval[filterTypeFunc](value)),
		appBlacklist: setupSql.bind(null, sql.getApp.blacklist[filterTypeFunc](value)),
		appAdministrators: setupSql.bind(null, sql.getApp.administrators[filterTypeFunc](value)),
		appHybridPreference: setupSql.bind(null, sql.getApp.hybridPreference[filterTypeFunc](value)),
		appPassthrough: setupSql.bind(null, sql.getApp.passthrough[filterTypeFunc](value))
	}, {method: 'parallel', eventLoop: true});

	return app.locals.flow([getAppFlow, model.constructFullAppObjs], {method: "waterfall", eventLoop: true});
}

function storeCategories(categories, callback) {
    const upsertCats = app.locals.db.setupSqlCommands(sql.upsertCategories(categories));

    const insertFlow = app.locals.flow([
        app.locals.flow(upsertCats, {method: 'parallel'})
    ], {method: 'series'});

    insertFlow(callback);
}

//application store functions

function storeApps (includeApprovalStatus, notifyOEM, apps, callback) {
    let queue = [];
    function recStore(includeApprovalStatus, theseApps, cb){
        const fullFlow = flow([
            //first check if the apps need to be deleted from or stored in the database
            flow(flame.map(theseApps, checkNeedsInsertionOrDeletion), {method: "parallel"}),
            filterApps.bind(null, includeApprovalStatus),
            //each app surviving the filter should be checked with the app_auto_approval table to see if it its status
            //should change to be accepted
            function (appObjs, next) {
                flame.async.map(appObjs, autoApprovalModifier, next);
            },
			function (appObjs, next) {
				flame.async.map(appObjs, autoBlacklistModifier, next);
			},
            function (appObjs, next) {
                flame.async.map(appObjs, model.storeApp.bind(null, notifyOEM), next);
            }
        ], {method: "waterfall", eventLoop: true});

        fullFlow(function (err, res) {
            if (err) {
                log.error(err);
                // res returns an array with the app ID in the position that it was in in the shaid app query
                // if the third app were to fail, then res would look like [ , , appID]
                let appID = res[res.length - 1];
                if(appID && queue[queue.length - 1] !== appID){ // ensures that the appID is not null and not already in the queue
                    queue.push(appID);
                }
                if(res.length !== theseApps.length){
                    let appsLeftover = theseApps.slice(res.length);
                    return recStore(includeApprovalStatus, appsLeftover, cb);
                }
            }
            cb();
        });
    }
    recStore(includeApprovalStatus, apps, function(){
        callback();
        if(queue.length > 0){
            attemptRetry(300000, queue);
        }
    });
}

//determine whether the object needs to be deleted or stored in the database
function checkNeedsInsertionOrDeletion (appObj, next) {
	if(appObj.deleted_ts){
		// delete!
		db.sqlCommand(sql.purgeAppInfo(appObj), function(err, data){
			// delete attempt made, skip it!
			next(null, null);
		});
	}else if(appObj.blacklisted_ts){
		// blacklist!
		db.sqlCommand(sql.insertAppBlacklist(appObj), function(err, data){
			// blacklist attempt made, skip it!
			next(null, null);
		});
	}else{
	    // check if the version exists in the database before attempting insertion
	    const getObjStr = sql.versionCheck('app_info', {
			app_uuid: appObj.uuid,
			version_id: appObj.version_id
		});
	    db.sqlCommand(getObjStr, function (err, data) {
			if(data.length > 0){
				// record exists, skip it!
				next(null, null);
			}else{
				next(null, appObj);
			}
	    });
	}
}

//any elements that are null are removed
//furthermore, remove approval status here if necessary
function filterApps (includeApprovalStatus, appObjs, next) {
    let filtered = appObjs.filter(function (appObj) {
        return appObj !== null;
    });
    filtered = filtered.map(function (appObj) {
        //if includeApprovalStatus is false, ignore the approval_status attribute by removing it
        //this would allow the database default to be used
        if (!includeApprovalStatus) {
            delete appObj.approval_status;
        }
        return appObj;
    });
    next(null, filtered);
}

//auto changes any app's approval status to ACCEPTED if a record was found for that app's uuid in the auto approval table
function autoApprovalModifier (appObj, next) {

	// check if auto-approve *all apps* is enabled
	if(config.autoApproveAllApps){
		appObj.approval_status = 'ACCEPTED';
		appObj.encryption_required = config.autoApproveSetRPCEncryption;
		next(null, appObj);
		return;
	}

	// check if auto-approve this specific app is enabled
    db.sqlCommand(sql.checkAutoApproval(appObj.uuid), function (err, res) {
        //if res is not an empty array, then a record was found in the app_auto_approval table
        //change the status of this appObj to ACCEPTED
        if (res.length > 0) {
            appObj.approval_status = 'ACCEPTED';
			appObj.encryption_required = config.autoApproveSetRPCEncryption;
        }
        next(null, appObj);
    });
}

// Auto deny new application versions of an app that is blacklisted
function autoBlacklistModifier (appObj, next) {
	db.sqlCommand(sql.getBlacklistedAppFullUuids(appObj.uuid), function (err, res) {
		if (res.length > 0) {
			appObj.approval_status = 'LIMITED';
		}
		next(null, appObj);
	});
}

// checks a retry queue of app IDs to requery their information from SHAID and attempt insertion into the database
function attemptRetry(milliseconds, retryQueue){
    if(milliseconds > 14400000){ // do not take longer than 4 hours
        milliseconds = 14400000;
    }
    log.error("Received app with incorrectly formatted info, will attempt to requery SHAID in " + (milliseconds / 60000) + " minutes");
    setTimeout(function(){
        flame.async.map(retryQueue, function(appID, callback){
            flame.async.waterfall([
                app.locals.shaid.getApplications.bind(null, {
                    "uuid": appID,
					"include_deleted": true,
					"include_blacklisted": true
                }),
                function(apps, callback){
                    const fullFlow = flow([
                        //first check if the apps need to be stored in the database
                        flow(flame.map(apps, checkNeedsInsertionOrDeletion), {method: "parallel"}),
                        filterApps.bind(null, false),
                        //each app surviving the filter should be checked with the app_auto_approval table to see if it its status
                        //should change to be accepted
                        function (appObjs, callback) {
                            flame.async.map(appObjs, autoApprovalModifier, callback);
                        },
						function (appObjs, callback) {
							flame.async.map(appObjs, autoBlacklistModifier, callback);
						},
                        function (appObjs, callback) {
                            flame.async.map(appObjs, model.storeApp.bind(null, true), callback);
                        }
                    ], {method: "waterfall", eventLoop: true});
                    fullFlow(function (err, res) {
                        if (err) {
                            log.error(err);
                            // increase wait time for retry by a factor of 5
                            attemptRetry(milliseconds * 5, res, callback);
                        } else {
                            log.info("App with previously malformed data successfully stored");
                            callback();
                        }
                    })
                }
            ], callback);
        }, function(){
            log.info("Apps in retry queue successfully added to the database");
        });
    }, milliseconds);
}

function storeAppCertificates (insertObjs, next) {
	app.locals.db.runAsTransaction(function (client, callback) {
		async.mapSeries(insertObjs, function (insertObj, cb) {
			app.locals.log.info("Updating certificate of " + insertObj.app_uuid);
            model.updateAppCertificate(insertObj.app_uuid, insertObj.certificate, cb);
		}, callback);
	}, function (err, response) {
		if(err){
			app.locals.log.error(err);
		}
		app.locals.log.info("App certificates updated");
		next();
	});
}

function createFailedAppsCert(failedApp, next){
	let options = certificates.getCertificateOptions({
		serialNumber: failedApp.app_uuid,
		clientKey: failedApp.private_key
	});

	certificates.createCertificateFlow(options, function(err, keyBundle){
		if(err){
			return next(err, {});
		}
        certUtil.createKeyCertBundle(keyBundle.clientKey, keyBundle.certificate)
            .then(keyCertBundle => {
                next(null, {
                    app_uuid: failedApp.app_uuid,
                    certificate: keyCertBundle
                });
            })
            .catch(err => {
                next(err)
            });
	});
}

function appStoreTransformation (min_rpc_version, min_protocol_version, apps, next) {
    // limit the information that's returned to the caller
    if (min_rpc_version) {
        apps = apps.filter(app => {
            // filter out apps with a lower min rpc version than the query
            const queryVersion = min_rpc_version.split('.');
            const appVersion = app.min_rpc_version.split('.');
            return versionCompare(appVersion, queryVersion)
        });
    }
    if (min_protocol_version) {
        apps = apps.filter(app => {
            // filter out apps with a lower min rpc version than the query
            const queryVersion = min_protocol_version.split('.');
            const appVersion = app.min_protocol_version.split('.');
            return versionCompare(appVersion, queryVersion)
        });
    }

    const newApps = apps
        .map(app => ({
            name: app.name,
            nicknames: app.display_names,
            description: app.description,
            policyAppID: app.uuid,
            enabled: app.enabled,
            transportType: app.cloud_transport_type,
            hybridAppPreference: app.hybrid_app_preference,
            icon_url: app.icon_url,
            package: {
                url: app.package_url,
                size_compressed_bytes: app.size_compressed_bytes,
                size_decompressed_bytes: app.size_decompressed_bytes,
            }
        }));
    next(null, newApps);
}

// compares two versions with this syntax: [major, minor, patch]
// returns true if v1 is higher or equal to v2
// returns false otherwise
function versionCompare (v1, v2) {
    if (v1[0] === undefined) {
        v1[0] = 0;
    }
    if (v1[1] === undefined) {
        v1[1] = 0;
    }
    if (v1[2] === undefined) {
        v1[2] = 0;
    }
    if (v2[0] === undefined) {
        v2[0] = 0;
    }
    if (v2[1] === undefined) {
        v2[1] = 0;
    }
    if (v2[2] === undefined) {
        v2[2] = 0;
    }
    // coerce to number
    v1 = v1.map(Number);
    v2 = v2.map(Number);

    if (v1[0] > v2[0]) {
        return true;
    } else if (v1[0] === v2[0]) {
        if (v1[1] > v2[1]) {
            return true;
        } else if (v1[1] === v2[1]) {
            if (v1[2] > v2[2]) {
                return true;
            } else if (v1[2] === v2[2]) {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
	  validateActionPost: validateActionPost,
	  validateAutoPost: validateAutoPost,
	  validateAdministratorPost: validateAdministratorPost,
	  validatePassthroughPost: validatePassthroughPost,
	  validateHybridPost: validateHybridPost,
	  validateRPCEncryptionPut: validateRPCEncryptionPut,
	  validateServicePermissionPut: validateServicePermissionPut,
	  validateFunctionalGroupPut: validateFunctionalGroupPut,
      validateUpdateAppCertificate: validateUpdateAppCertificate,
    validateWebHook: validateWebHook,
    checkIdIntegerBody: checkIdIntegerBody,
    storeAppCertificates: storeAppCertificates,
    createFailedAppsCert: createFailedAppsCert,
    createAppInfoFlow: createAppInfoFlow,
    storeApps: storeApps,
    storeCategories: storeCategories,
    appStoreTransformation: appStoreTransformation,
};
