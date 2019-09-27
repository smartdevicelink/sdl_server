const app = require('../app');
const helper = require('./helper.js');
const sql = require('./sql.js');
const flow = app.locals.flow;
const async = require('async');
const pem = require('pem');
const settings = require('../../../settings.js');

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
	chosenFlow(function (err, apps) {
		if (err) {
			app.locals.log.error(err);
			res.parcel.setStatus(500);
		} else {
			if(apps.length == 1){
				return forwardAppCertificate(apps[0].uuid, function(sqlErr, results){
					if(sqlErr){
						return res.parcel.setStatus(500)
							.setMessage('Internal Server Error')
							.deliver();
					}
					if(results.length == 0){
						return res.parcel.setStatus(200)
							.setData({
								applications:apps
							})
							.deliver();
					}
					pem.readPkcs12(Buffer.from(results[0].certificate, 'base64'), 
						{
							"p12Password": settings.certificateAuthority.passphrase
						}, function(certErr, keyBundle){
							if(certErr){
								app.locals.log.error(certErr)
								return res.parcel.setStatus(500)
									.setMessage("Internal Server Error")
									.deliver();
							} else {
								apps[0].certificate = keyBundle.cert;
								apps[0].private_key = keyBundle.key;
								return res.parcel.setStatus(200)
									.setData({
										applications: apps
									})
									.deliver();
							}
						}
					)
				})
			} else {
				res.parcel
					.setStatus(200)
					.setData({
						applications: apps
					});
			}
		}
		return res.parcel.deliver();
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

function getAppCertificate(req, res, next){
	// Ford's Android 	security library uses AppId
	// The SDL	iOS 	security library uses appId
	const app_uuid = req.body.app_uuid || 
					req.body.AppId || 
					req.body.appId || 
					req.query.app_uuid || 
					req.query.AppId || 
					req.query.appId || 
					req.query.appID;
	
	if(!app_uuid){
		return res.parcel.setStatus(400)
			.setMessage('No app id was sent')
			.deliver();
	}
	
	forwardAppCertificate(app_uuid, function(err, results){
		if(err){
			app.locals.log.error(err);
			return res.parcel.setStatus(400)
				.setMessage('Could not find app with that id')
				.deliver();
		}
		if(results && results[0] && results[0].certificate){
			pem.readPkcs12(Buffer.from(results[0].certificate, 'base64'), 
				{ 
					p12Password: settings.securityOptions.passphrase 
				}, function(err, keyBundle){
					if(err){
						app.locals.log.error(err);
						return res.parcel.setStatus(500)
							.setMessage('Internal Server Error')
							.deliver();
					}
					helper.isCertificateExpired(keyBundle.cert, function(crtErr, isValid){
						if(crtErr){
							app.locals.log.error(crtErr);
						}
						if(!isValid){
							return res.parcel.setStatus(500)
								.setMessage('App certificate is expired')
								.deliver();
						}
						res.parcel.setStatus(200)
							.setData({"Certificate": results[0].certificate})
							.deliver();
					})
				}
			)
		} else {
			res.parcel.setStatus(400)
				.setMessage('Could not find certificate for app with that id')
				.deliver();
		}
	})
}

function updateAppCertificate(req, res, next){
    pem.createPkcs12(
		req.body.options.clientKey, 
		req.body.options.certificate, 
		settings.certificateAuthority.passphrase, 
		function(err, pkcs12){
			if(err){
				app.locals.log.error(err);
				return res.parcel.setStatus(400)
					.setData(err)
					.deliver();
			}
			app.locals.db.sqlCommand(sql.updateAppCertificate(req.body.options.app_uuid, pkcs12.pkcs12.toString('base64')), function(sqlErr, results){
				if(sqlErr){
					app.locals.log.error(sqlErr);
					return res.parcel.setStatus(500)
						.setMessage("Internal Server Error")
						.deliver();
				}
				return res.parcel.setStatus(200).deliver();
			});
		}
	);
}

function checkAndUpdateCertificates(cb){
	app.locals.db.sqlCommand(sql.getApp.allCertificates(), parseAppCerts);

	function parseAppCerts(sqlErr, appIdsAndCerts){
		if(sqlErr){
			app.locals.log.error(sqlErr);
		}
		async.mapSeries(appIdsAndCerts, function(appObj, next){
			if(appObj.certificate){
				pem.readPkcs12(Buffer.from(appObj.certificate, 'base64'), 
					{
						p12Password: settings.securityOptions.passphrase
					},  function(pkcsErr, keyBundle){
						if(pkcsErr){
							app.locals.log.error(pkcsErr);
							next(
								null, 
								{ 
									app_uuid: appObj.app_uuid, 
									private_key: keyBundle.key 
								}
							);
						}
						helper.isCertificateExpired(keyBundle.cert, function(crtErr, isValid){
							if(crtErr){
								app.locals.log.error(crtErr);
							}
							// if the certificate is expired, create a new one with the already existing private key
							next(
								null, 
								(isValid) ? null : { app_uuid: appObj.app_uuid, private_key: keyBundle.key }
							);
						});
					}
				)
			} else {
				// app does not have a certificate, and does not private key, so both must be created
				next(
					null, 
					{ 
						app_uuid: appObj.app_uuid 
					}
				);
			}
		}, function(err, failedApps){
			if(err){
				app.locals.log.error(err);
			}
			//removes all null values to only focus on the app ids that failed
			failedApps = failedApps.filter(Boolean);
			async.mapSeries(failedApps, helper.getFailedAppsCert, function(failedAppErr, results){
				if(failedAppErr){
					app.locals.log.error(failedAppErr);
				}
				helper.storeAppCertificates(results, function(){
					if(cb){
						cb();
					}
				});
			});
		});
	}
}

module.exports = {
	get: get,
	actionPost: actionPost,
	putServicePermission: putServicePermission,
	autoPost: autoPost,
	administratorPost: administratorPost,
	passthroughPost: passthroughPost,
	hybridPost: hybridPost,
	webhook: webhook,
	queryAndStoreApplicationsFlow: queryAndStoreApplicationsFlow,
	getAppCertificate: getAppCertificate,
	updateAppCertificate: updateAppCertificate,
	checkAndUpdateCertificates: checkAndUpdateCertificates,
};
