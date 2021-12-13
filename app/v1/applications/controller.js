const app = require('../app');
const helper = require('./helper.js');
const model = require('./model.js');
const sql = require('./sql.js');
const moment = require('moment');
const settings = require('../../../settings.js');
const certUtil = require('../helpers/certificates.js');
const certificates = require('../certificates/controller.js');

async function get (req, res, next) {
	//prioritize id, uuid, approval status, in that order.
	//only one parameter can be acted upon in one request
	let apps; //to be determined

	if (req.query.id) { //filter by id
		if (Number.isNaN(Number(req.query.id))) {
            return res.parcel.setStatus(400).setMessage("id must be an integer").deliver();
        }
		apps = await helper.createAppInfoFlow('idFilter', req.query.id);
	}
	else if (req.query.uuid) { //filter by app uuid
		apps = await helper.createAppInfoFlow('multiFilter', {app_uuid: req.query.uuid});
	}
	else if (req.query.approval_status || req.query.get_blacklist) { //filter by approval status
		apps = await helper.createAppInfoFlow('multiFilter', {approval_status: req.query.approval_status, get_blacklist: (req.query.get_blacklist == "true")});
	}
	else { //get all applications whose information are the latest versions
		apps = await helper.createAppInfoFlow('multiFilter');
	}

	//include extra certificate information if just one app is returned and if the info exists
	//only if looking at a specific app and cert generation is enabled

	try {
		if (apps.length === 1 && certificates.openSSLEnabled) {
			const appCert = await getAppCertificateByUuid(apps[0].uuid);
			const certificate = appCert.certificate;
			if (certificate) {
				const keyBundle = await certUtil.readKeyCertBundle(Buffer.from(certificate, 'base64'));
				apps[0].certificate = keyBundle.cert;
				apps[0].private_key = keyBundle.key;
			}
		}

		res.parcel.setStatus(200)
			.setData({
				applications: apps
			})
			.deliver();
	} catch (err) {
		app.locals.log.error(err)
		return res.parcel.setStatus(500)
			.setMessage("Internal Server Error")
			.deliver();
	}
}

//TODO: emailing system for messaging the developer about the approval status change
async function actionPost (req, res, next) {
	helper.validateActionPost(req, res);
	helper.checkIdIntegerBody(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	await app.locals.db.asyncTransaction(async client => {
		// Blacklist/Unblacklist app
		if (req.body.blacklist) {
			await client.getOne(sql.insertAppBlacklist(req.body));
		} else {
			await client.getOne(sql.deleteAppBlacklist(req.body.uuid));
		}
		
		// Update approval status for app
		await client.getOne(sql.changeAppApprovalStatus(req.body.id, req.body.approval_status, (req.body.denial_message || null)));

		// sync the status to SHAID
		if (req.body.version_id) {
			await app.locals.shaid.setApplicationApprovalVendor([{
				"uuid": req.body.uuid,
				"blacklist": req.body.blacklist || false,
				"version_id": req.body.version_id,
				"approval_status": req.body.approval_status,
				"notes": req.body.denial_message || null
			}]);
		}
		// skip notifying SHAID if there is no version ID (legacy support)
	}).then(() => {
		res.parcel.setStatus(200).deliver();
	}).catch(err => {
		app.locals.log.error(err);
		res.parcel.setStatus(500).deliver();
	});
}

async function hybridPost (req, res, next) {
	helper.validateHybridPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	await app.locals.db.asyncTransaction(async client => {
		const result = await client.getOne(sql.getApp.base['uuidFilter'](req.body.uuid));
		if (!result) {
			throw new Error("Unknown app");
		}
		await client.getOne(sql.deleteHybridPreference(req.body.uuid));
		await client.getOne(sql.insertHybridPreference(req.body));

	}).then(() => {
		res.parcel.setStatus(200).deliver();
	}).catch(err => {
		app.locals.log.error(err);
		res.parcel.setStatus(500).deliver();
	});
}

async function rpcEncryptionPut (req, res, next) {
	helper.validateRPCEncryptionPut(req, res);
	helper.checkIdIntegerBody(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	await app.locals.db.asyncTransaction(async client => {
		const result = await client.getOne(sql.getApp.base['idFilter'](req.body.id));
		if (!result) {
			throw new Error("Unknown app");
		}
		await client.getOne(sql.updateRPCEncryption(req.body));
	}).then(() => {
		res.parcel.setStatus(200).deliver();
	}).catch(err => {
		app.locals.log.error(err);
		res.parcel.setStatus(500).deliver();
	});
}

async function autoPost (req, res, next) {
	helper.validateAutoPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	try {
		const results = await app.locals.db.asyncSql(sql.getApp.base['uuidFilter'](req.body.uuid));
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}
		if (req.body.is_auto_approved_enabled) {
			await app.locals.db.asyncSql(sql.insertAppAutoApproval(req.body));
		} else {
			await app.locals.db.asyncSql(sql.deleteAutoApproval(req.body.uuid));
		}
		res.parcel.setStatus(200).deliver();
	} catch (err) {
		res.parcel.setStatus(500).deliver();
	}
}

async function administratorPost (req, res, next) {
	helper.validateAdministratorPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	try {
		const results = await app.locals.db.asyncSql(sql.getApp.base['uuidFilter'](req.body.uuid));
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}
		if (req.body.is_administrator_app) {
			await app.locals.db.asyncSql(sql.insertAppAdministrator(req.body));
		} else {
			await app.locals.db.asyncSql(sql.deleteAppAdministrator(req.body.uuid));
		}
		res.parcel.setStatus(200).deliver();
	} catch (err) {
		res.parcel.setStatus(500).deliver();
	}
}

async function passthroughPost (req, res, next) {
	helper.validatePassthroughPost(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	try {
		const results = await app.locals.db.asyncSql(sql.getApp.base['uuidFilter'](req.body.uuid));
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}
		if (req.body.allow_unknown_rpc_passthrough) {
			await app.locals.db.asyncSql(sql.insertPassthrough(req.body));
		} else {
			await app.locals.db.asyncSql(sql.deletePassthrough(req.body.uuid));
		}
		res.parcel.setStatus(200).deliver();
	} catch (err) {
		res.parcel.setStatus(500).deliver();
	}
}

async function putServicePermission (req, res, next) {
	helper.validateServicePermissionPut(req, res);
	helper.checkIdIntegerBody(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	try {
		const results = await app.locals.db.asyncSql(sql.getApp.base['idFilter'](req.body.id));
		if (!results.length) {
			return res.parcel.setStatus(400).deliver();
		}
		if (results[0].approval_status == "ACCEPTED") {
			return res.parcel
				.setStatus(400)
				.setMessage("You may not modify the app service permissions of a production application.")
				.deliver();
		}

		if (req.body.is_selected) {
			await app.locals.db.asyncSql(sql.insertAppServicePermission(req.body));
		} else {
			await app.locals.db.asyncSql(sql.deleteAppServicePermission(req.body));
		}
		res.parcel.setStatus(200).deliver();
	} catch (err) {
		res.parcel.setStatus(500).deliver();
	}
}

async function getFunctionalGroups (req, res, next) {
	try {
		const results = await app.locals.db.asyncSql(sql.getAppFunctionalGroups(req.query));
		res.parcel
			.setStatus(200)
			.setData({
				"groups": results
			})
			.deliver();
	} catch (err) {
		req.app.locals.log.error(err);
		res.parcel
			.setStatus(500)
			.deliver();
	}
}

async function putFunctionalGroup (req, res, next) {
	helper.validateFunctionalGroupPut(req, res);
	if (res.parcel.message) {
		return res.parcel.deliver();
	}

	try {
		const results = await app.locals.db.asyncSql(sql.getApp.base['idFilter'](req.body.app_id));
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

		if (req.body.is_selected) {
			await app.locals.db.asyncSql(sql.insertAppFunctionalGroup(req.body));
		} else {
			await app.locals.db.asyncSql(sql.deleteAppFunctionalGroup(req.body));
		}

		res.parcel.setStatus(200).deliver();
	} catch (err) {
		res.parcel.setStatus(500).deliver();
	}
}

//expects a POST from SHAID
async function webhook (req, res, next) {
    helper.validateWebHook(req, res);
    if (res.parcel.message) {
        return res.parcel.deliver();
    }

    try {
		if (req.body.entity == "application") {
			const query = {
		        "uuid": req.body.uuid,
				"include_deleted": true,
				"include_blacklisted": true
		    };

			switch(req.body.action){
				case "UPSERT":
					await queryAndStoreApplications(query, true);
					break;
				case "DELETE":
					await app.locals.db.asyncSql(sql.purgeAppInfo(query));
					break;
				case "BLACKLIST":
					await app.locals.db.asyncSql(sql.insertAppBlacklist(query));
					break;
				default:
			}
		}
    } catch (err) {
		req.app.locals.log.error(err);
    }

	res.parcel.setStatus(200);
	res.parcel.deliver();
}

//queries SHAID to get applications and stores them into the database
async function queryAndStoreApplications (queryObj, notifyOEM = true) {
	const apps = await app.locals.shaid.getApplications(queryObj);
	await helper.storeApps(false, notifyOEM, apps);
}

//helper function that attempts to find the associated certificate bundle in the database
async function getAppCertificateByUuid (app_uuid) {
    const result = await app.locals.db.asyncSql(sql.getApp.certificate(app_uuid));
    return result ? result : {};
}

//todo
async function getAppCertificate (req, res, next) {
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

    try {
	    const appCert = await getAppCertificateByUuid(app_uuid);
	    if (!appCert.certificate) {
            return res.parcel.setStatus(400)
                .setMessage('Could not find certificate for app with that id')
                .deliver();
        }
        const expirationDate = moment.utc(appCert.expiration_ts);
        const currentDate = moment.utc();

        if (moment(expirationDate).isBefore(currentDate)) {
			return res.parcel.setStatus(500)
                .setMessage('App certificate is expired')
                .deliver();
        }
        else {
	        res.parcel.setStatus(200)
	            .setData({ 'certificate': appCert.certificate })
	            .deliver();
        }
    } catch (err) {
		app.locals.log.error(err);
        res.parcel.setStatus(500).deliver();
    }
}

async function updateAppCertificate (req, res, next) {
    if (!certificates.openSSLEnabled) {
        return res.parcel.setStatus(400)
            .setMessage('Security options have not been properly configured')
            .deliver();
    }

	helper.validateUpdateAppCertificate(req, res);

	if (res.parcel.message) {
		return res.parcel.deliver();
	}

    //make sure the passed in app uuid exists in the db
    try {
		const results = await app.locals.db.asyncSql(sql.getApp.base['uuidFilter'](req.body.options.app_uuid));
		if (!results.length) {
			return res.parcel
				.setStatus(400)
				.setMessage("Invalid app.")
				.deliver();
		}

		//valid app uuid. continue
		const keyCertBundle = await certUtil.createKeyCertBundle(req.body.options.clientKey, req.body.options.certificate);
		await model.updateAppCertificate(req.body.options.app_uuid, keyCertBundle);
		res.parcel.setStatus(200).deliver();
    } catch (err) {
		app.locals.log.error(err);
    	res.parcel.setStatus(500).deliver();
    }
}

async function checkAndUpdateCertificates () {
	if (!certificates.openSSLEnabled) {
		return;
	}

	const expiredCertObjs = await app.locals.db.asyncSql(sql.getApp.allExpiredCertificates())

	let failedApps = [];

	for (let expiredCertObj of expiredCertObjs) {
		await certUtil.readKeyCertBundle(Buffer.from((expiredCertObj.certificate || ""), 'base64'))
			.then(keyBundle => {
				app.locals.log.info("creating new cert for app with existing key");
				failedApps.push({
					app_uuid: expiredCertObj.app_uuid,
					private_key: keyBundle.key
				});
			})
			.catch(pkcsErr => {
		        app.locals.log.info("creating new key and cert for app");
				failedApps.push({
					app_uuid: expiredCertObj.app_uuid,
				});
			});
	}

	//create new certificates for the failed apps and save them
	const results = await Promise.all(failedApps.map(helper.createFailedAppsCert));

	await helper.storeAppCertificates(results);
}

/**
 * queries SHAID to get new categories and stores them into the database
 */
async function queryAndStoreCategories () {
	const categories = await app.locals.shaid.getCategories({});
	await helper.storeCategories(categories);
	app.locals.log.info("App categories sync complete.");
}

async function getStagingAppStore (req, res, next) {
	let filterObj = {
		approval_status: 'STAGING',
		platform: 'EMBEDDED',
	};

	if (req.query.uuid) {
		filterObj.app_uuid = req.query.uuid;
	}
	if (req.query.transport_type) {
		filterObj.transport_type = req.query.transport_type;
	}

	try {
		const appInfo = await helper.createAppInfoFlow('multiFilter', filterObj);
		const apps = helper.appStoreTransformation(req.query.min_rpc_version, req.query.min_protocol_version, appInfo);
		
		res.parcel.setStatus(200)
			.setData({
				applications: apps,
			})
			.deliver();
	} catch (err) {
		app.locals.log.error(err);
		res.parcel.setStatus(500).deliver();
	}
}

async function getAppStore (req, res, next) {
    // only let embedded apps through
	let filterObj = {
		approval_status: 'ACCEPTED',
        platform: 'EMBEDDED',
	};

    if (req.query.uuid) { //filter by app uuid
        filterObj.app_uuid = req.query.uuid;
    }
    if (req.query.transport_type) { //filter by transport type
        filterObj.transport_type = req.query.transport_type;
    }

    try {
    	const appInfo = await helper.createAppInfoFlow('multiFilter', filterObj);    
		const apps = helper.appStoreTransformation(req.query.min_rpc_version, req.query.min_protocol_version, appInfo);

		res.parcel.setStatus(200)
			.setData({
				applications: apps
			})
			.deliver();
    } catch (err) {
    	app.locals.log.error(err);
		res.parcel.setStatus(500).deliver();
    }
}

module.exports = {
	get: get,
	actionPost: actionPost,
	putServicePermission: putServicePermission,
	autoPost: autoPost,
	administratorPost: administratorPost,
	passthroughPost: passthroughPost,
	rpcEncryptionPut: rpcEncryptionPut,
	hybridPost: hybridPost,
	getFunctionalGroups: getFunctionalGroups,
	putFunctionalGroup: putFunctionalGroup,
	webhook: webhook,
	queryAndStoreApplications: queryAndStoreApplications,
  	queryAndStoreCategories: queryAndStoreCategories,
	getAppCertificate: getAppCertificate,
	updateAppCertificate: updateAppCertificate,
	checkAndUpdateCertificates: checkAndUpdateCertificates,
	getAppStore: getAppStore,
	getStagingAppStore: getStagingAppStore,
};
