const app = require('../app');
const helper = require('./helper.js');
const sql = require('./sql.js');
const flow = app.locals.flow;
const async = require('async');
const settings = require('../../../settings.js');
const certUtil = require('../helpers/certificates.js');
const certificates = require('../certificates/controller.js');

function get (req, res, next) {
	//prioritize id, uuid, approval status, in that order.
	//only one parameter can be acted upon in one request
	let chosenFlow; //to be determined

	if (req.query.id) { //filter by id
		chosenFlow = helper.createAppInfoFlow('idFilter', req.query.id);
	}
	else if (req.query.uuid) { //filter by app uuid
		chosenFlow = helper.createAppInfoFlow('multiFilter', {app_uuid: req.query.uuid});
	}
	else if (req.query.approval_status || req.query.get_blacklist) { //filter by approval status
		chosenFlow = helper.createAppInfoFlow('multiFilter', {approval_status: req.query.approval_status, get_blacklist: (req.query.get_blacklist == "true")});
	}
	else { //get all applications whose information are the latest versions
		chosenFlow = helper.createAppInfoFlow('multiFilter');
	}

	const finalFlow = flow([
		chosenFlow,
		//include extra certificate information if just one app is returned and if the info exists
		function (apps, next) {
			//only if looking at a specific app and cert generation is enabled
			if (apps.length === 1 && certificates.openSSLEnabled) {
				const certInsertionFlow = flow([
					getAppCertificateByUuid.bind(null, apps[0].uuid),
					function (certificate, next) {
						if (!certificate) {
							return next(null, apps);
						}
						certUtil.readKeyCertBundle(Buffer.from(certificate, 'base64'))
							.then(keyBundle => {
								apps[0].certificate = keyBundle.cert;
								apps[0].private_key = keyBundle.key;
								next(null, apps);
							})
							.catch(next);
					}
				], { method: "waterfall" });
				return certInsertionFlow(next);
			} else {
				return next(null, apps);
			}
		},
	], { method: 'waterfall' });

	finalFlow(function (err, apps) {
		if (err) {
			app.locals.log.error(err)
			return res.parcel.setStatus(500)
				.setMessage("Internal Server Error")
				.deliver();
		}
		return res.parcel.setStatus(200)
			.setData({
				applications: apps
			})
			.deliver();
	});

}

//TODO: emailing system for messaging the developer about the approval status change
function actionPost (req, res, next) {
	helper.validateActionPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.runAsTransaction(function (client, callback) {
		async.waterfall([
			// Blacklist/Unblacklist app
			function (callback) {
				if (req.body.blacklist) {
					client.getOne(sql.insertAppBlacklist(req.body), callback);
				} else {
					client.getOne(sql.deleteAppBlacklist(req.body.uuid), callback);
				}
			},
			// Update approval status for app
			function (blacklist, callback) {
				client.getOne(sql.changeAppApprovalStatus(req.body.id, req.body.approval_status, (req.body.denial_message || null)), callback);
			},
			// sync the status to SHAID
			function (result, callback) {
				if(!req.body.version_id){
					// skip notifying SHAID if there is no version ID (legacy support)
					callback(null, null);
					return;
				}
				app.locals.shaid.setApplicationApprovalVendor([{
					"uuid": req.body.uuid,
					"blacklist": req.body.blacklist || false,
					"version_id": req.body.version_id,
					"approval_status": req.body.approval_status,
					"notes": req.body.denial_message || null
				}], callback);
			}
		], callback);
	}, function (err, response) {
		if (err) {
			app.locals.log.error(err);
			return res.parcel.setStatus(500).deliver();
		} else {
			return res.parcel.setStatus(200).deliver();
		}
	});
}

function hybridPost (req, res, next) {
	helper.validateHybridPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.runAsTransaction(function (client, callback) {
		async.waterfall([
			function (callback) {
				client.getOne(sql.getApp.base['uuidFilter'](req.body.uuid), callback);
			},
			function (result, callback) {
				if (!result) {
					return callback("Unknown app");
				}
				client.getOne(sql.deleteHybridPreference(req.body.uuid), callback);
			},
			function(result, callback) {
				client.getOne(sql.insertHybridPreference(req.body), callback);
			}
		], callback);
	}, function (err, response) {
		if (err) {
			app.locals.log.error(err);
			return res.parcel.setStatus(500).deliver();
		} else {
			return res.parcel.setStatus(200).deliver();
		}
	});
}

function autoPost (req, res, next) {
	helper.validateAutoPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.sqlCommand(sql.getApp.base['uuidFilter'](req.body.uuid), function(err, results) {
		if (err) {
			return res.parcel.setStatus(500).deliver();
		}
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}

		let chosenCommand;
		if (req.body.is_auto_approved_enabled) {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.insertAppAutoApproval(req.body));
		} else {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.deleteAutoApproval(req.body.uuid));
		}

		chosenCommand(function (err, results) {
			if (err) {
				return res.parcel.setStatus(500).deliver();
			}
			return res.parcel.setStatus(200).deliver();
		});
	});
}

function administratorPost (req, res, next) {
	helper.validateAdministratorPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.sqlCommand(sql.getApp.base['uuidFilter'](req.body.uuid), function(err, results) {
		if (err) {
			return res.parcel.setStatus(500).deliver();
		}
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}

		let chosenCommand;
		if (req.body.is_administrator_app) {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.insertAppAdministrator(req.body));
		} else {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.deleteAppAdministrator(req.body.uuid));
		}

		chosenCommand(function (err, results) {
			if (err) {
				return res.parcel.setStatus(500).deliver();
			}
			return res.parcel.setStatus(200).deliver();
		});
	});
}

function passthroughPost (req, res, next) {
	helper.validatePassthroughPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.sqlCommand(sql.getApp.base['uuidFilter'](req.body.uuid), function(err, results) {
		if (err) {
			return res.parcel.setStatus(500).deliver();
		}
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}

		let chosenCommand;
		if (req.body.allow_unknown_rpc_passthrough) {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.insertPassthrough(req.body));
		} else {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.deletePassthrough(req.body.uuid));
		}

		chosenCommand(function (err, results) {
			if (err) {
				return res.parcel.setStatus(500).deliver();
			}
			return res.parcel.setStatus(200).deliver();
		});
	});
}

function putServicePermission (req, res, next) {
	helper.validateServicePermissionPut(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.sqlCommand(sql.getApp.base['idFilter'](req.body.id), function(err, results) {
		if (err) {
			return res.parcel.setStatus(500).deliver();
		}
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}

		if (results[0].approval_status == "ACCEPTED") {
			return res.parcel
				.setStatus(400)
				.setMessage("You may not modify the app service permissions of a production application.")
				.deliver();
		}

		let chosenCommand;
		if (req.body.is_selected) {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.insertAppServicePermission(req.body));
		} else {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.deleteAppServicePermission(req.body));
		}

		chosenCommand(function (err, results) {
			if (err) {
				return res.parcel.setStatus(500).deliver();
			}
			return res.parcel.setStatus(200).deliver();
		});
	});
}

function getFunctionalGroups (req, res, next) {
	app.locals.db.getMany(sql.getAppFunctionalGroups(req.query), function(err, results) {
		if (err) {
			req.app.locals.log.error(err);
			return res.parcel
				.setStatus(500)
				.deliver();
		}
		return res.parcel
			.setStatus(200)
			.setData({
				"groups": results
			})
			.deliver();
	});
}

function putFunctionalGroup (req, res, next) {
	helper.validateFunctionalGroupPut(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	app.locals.db.sqlCommand(sql.getApp.base['idFilter'](req.body.app_id), function(err, results) {
		if (err) {
			return res.parcel
				.setStatus(500)
				.setMessage("Internal service error.")
				.deliver();
		}
		if (!results.length) {
			return res.parcel
				.setStatus(400)
				.setMessage("Invalid app.")
				.deliver();
		}

		if (results[0].approval_status == "ACCEPTED") {
			return res.parcel
				.setStatus(400)
				.setMessage("You may not modify the functional group grants of a production application.")
				.deliver();
		}

		let chosenCommand;
		if (req.body.is_selected) {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.insertAppFunctionalGroup(req.body));
		} else {
			chosenCommand = app.locals.db.sqlCommand.bind(null, sql.deleteAppFunctionalGroup(req.body));
		}

		chosenCommand(function (err, results) {
			if (err) {
				return res.parcel.setStatus(500).deliver();
			}
			return res.parcel.setStatus(200).deliver();
		});
	});
}

//expects a POST from SHAID
function webhook (req, res, next) {
    helper.validateWebHook(req, res);
    if (res.parcel.message) {
        return res.parcel.deliver();
    }

	async.waterfall([
		(callback)=>{
			if(req.body.entity == "application"){
				const query = {
		            "uuid": req.body.uuid,
					"include_deleted": true,
					"include_blacklisted": true
		        };

				switch(req.body.action){
					case "UPSERT":
						const queryAndStoreFlow = queryAndStoreApplicationsFlow(query, true);
				        queryAndStoreFlow(callback);
						break;
					case "DELETE":
						app.locals.db.sqlCommand(sql.purgeAppInfo(query), callback);
						break;
					case "BLACKLIST":
						app.locals.db.sqlCommand(sql.insertAppBlacklist(query), callback);
						break;
					default:
						callback(null, null);
				}
			}else{
				callback(null, null);
			}
		}
	], (err, result)=>{
		if (err) {
			req.app.locals.log.error(err);
		}
		res.parcel.setStatus(200);
		res.parcel.deliver();
	});
}

//queries SHAID to get applications and stores them into the database
function queryAndStoreApplicationsFlow (queryObj, notifyOEM = true) {
    return flow([
    	app.locals.shaid.getApplications.bind(null, queryObj),
    	helper.storeApps.bind(null, false, notifyOEM)
    ], {method: 'waterfall', eventLoop: true});
}

function forwardAppCertificate(app_uuid, next){
	app.locals.db.sqlCommand(sql.getApp.certificate(app_uuid), function(err, results){
		next(err, (err) ? null : results)
	})
}

//helper function that attempts to find the associated certificate bundle in the database
function getAppCertificateByUuid (app_uuid, callback) {
	forwardAppCertificate(app_uuid, function (err, results) {
		if (err) {
			return callback(err);
		}

		if (results && results[0] && results[0].certificate) {
			callback(null, results[0].certificate);
		}
		else {
			callback(null, null); //none found
		}
	});
}

function getAppCertificate(req, res, next) {
    if (!certificates.openSSLEnabled) {
        return res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }
    // Ford's Android     security library uses AppId
    // The SDL    iOS     security library uses appId
    const app_uuid = req.body.AppId ||
        req.body.appId ||
        req.query.AppId ||
        req.query.appId;

    if (!app_uuid) {
        return res.parcel.setStatus(400)
            .setMessage('No app id was sent')
            .deliver();
    }

    getAppCertificateByUuid(app_uuid, function(err, certificate) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel.setStatus(500)
                .setMessage('Internal Server Error')
                .deliver();
        }
        if (!certificate) {
            return res.parcel.setStatus(400)
                .setMessage('Could not find certificate for app with that id')
                .deliver();
        }

        certUtil.readKeyCertBundle(Buffer.from(certificate, 'base64'))
            .then(keyBundle => {
                return new Promise((resolve, reject) => {
                    certUtil.isCertificateExpired(keyBundle.cert, function(err, isExpired) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(!isExpired);
                    });
                });
            })
            .then(isValid => {
                if (!isValid) {
                    return res.parcel.setStatus(500)
                        .setMessage('App certificate is expired')
                        .deliver();
                } else {
                    res.parcel.setStatus(200)
                        .setData({ 'certificate': certificate })
                        .deliver();
                }
            })
            .catch(err => {
                app.locals.log.error(err);
                return res.parcel.setStatus(500)
                    .setMessage('Internal Server Error')
                    .deliver();
            });
    });
}

function updateAppCertificate(req, res, next) {
    if (!certificates.openSSLEnabled) {
        return res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }

    let doUpdate = function(keyCertBundle) {
        helper.updateAppCertificate(req.body.options.app_uuid, keyCertBundle, function(err) {
            if (err) {
                app.locals.log.error(err);
                return res.parcel.setStatus(500)
                    .setMessage('Internal Server Error')
                    .deliver();
            }
            return res.parcel.setStatus(200).deliver();
        });
    };

    if (!req.body.options.clientKey && !req.body.options.certificate) {
        return doUpdate(
            {
                pkcs12: ''
            }
        );
    } else {
        certUtil.createKeyCertBundle(req.body.options.clientKey, req.body.options.certificate)
            .then(keyCertBundle => {
                return doUpdate(keyCertBundle);
            });
    }
}

function checkAndUpdateCertificates(cb){
	if (!certificates.openSSLEnabled) {
		return cb();
	}

	app.locals.db.sqlCommand(sql.getApp.allCertificates(), parseAppCerts);

	function parseAppCerts(sqlErr, appIdsAndCerts){
		if(sqlErr){
			app.locals.log.error(sqlErr);
		}
		async.mapSeries(appIdsAndCerts, function (appObj, next) {
			if (appObj.certificate) {
				certUtil.readKeyCertBundle(Buffer.from(appObj.certificate, 'base64'))
					.then(keyBundle => {
						certUtil.isCertificateExpired(keyBundle.cert, function (crtErr, isExpired) {
							if (crtErr) {
								app.locals.log.error(crtErr);
							}
							// if the certificate is expired, create a new one with the already existing private key
							return next(
								null,
								(!isExpired) ? null : { app_uuid: appObj.app_uuid, private_key: keyBundle.key }
							);
						});
					})
					.catch(pkcsErr => {
						app.locals.log.error(pkcsErr);
						next(
							null,
							{
								app_uuid: appObj.app_uuid,
								private_key: keyBundle.key
							}
						);
					});
			} else {
				// app does not have a certificate nor a private key, so both must be created
				next(
					null,
					{
						app_uuid: appObj.app_uuid
					}
				);
			}
		}, function (err, failedApps) {
			if (err) {
				app.locals.log.error(err);
			}
			//removes all null values to only focus on the app ids that failed
			failedApps = failedApps.filter(Boolean);
			async.mapSeries(failedApps, helper.getFailedAppsCert, function (failedAppErr, results) {
				if (failedAppErr) {
					app.locals.log.error(failedAppErr);
				}
				helper.storeAppCertificates(results, function () {
					if (cb) {
						cb();
					}
				});
			});
		});
	}
}

/**
 * queries SHAID to get new categories and stores them into the database
 */
function queryAndStoreCategories(callback) {
    return flow(
        [
            app.locals.shaid.getCategories.bind(null, {}),
            helper.storeCategories
        ],
        { method: 'waterfall', eventLoop: true }
    )(callback);
}

module.exports = {
	get: get,
	actionPost: actionPost,
	putServicePermission: putServicePermission,
	autoPost: autoPost,
	administratorPost: administratorPost,
	passthroughPost: passthroughPost,
	hybridPost: hybridPost,
	getFunctionalGroups: getFunctionalGroups,
	putFunctionalGroup: putFunctionalGroup,
	webhook: webhook,
	queryAndStoreApplicationsFlow: queryAndStoreApplicationsFlow,
  	queryAndStoreCategories: queryAndStoreCategories,
	getAppCertificate: getAppCertificate,
	updateAppCertificate: updateAppCertificate,
	checkAndUpdateCertificates: checkAndUpdateCertificates,
};
