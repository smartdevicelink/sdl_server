const check = require('check-types');
const app = require('../app');
const model = require('./model.js');
const asyncSql = app.locals.db.asyncSql;
const sql = require('./sql.js');
const log = app.locals.log;
const db = app.locals.db;
const config = app.locals.config;
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
async function createAppInfoFlow (filterTypeFunc, value) {
    const getAppObj = {
        appBase: asyncSql(sql.getApp.base[filterTypeFunc](value)),
        appCountries: asyncSql(sql.getApp.countries[filterTypeFunc](value)),
        appDisplayNames: asyncSql(sql.getApp.displayNames[filterTypeFunc](value)),
        appPermissions: asyncSql(sql.getApp.permissions[filterTypeFunc](value)),
        appCategories: asyncSql(sql.getApp.category[filterTypeFunc](value)),
        appAllCategories: asyncSql(sql.getApp.allCategories[filterTypeFunc](value)),
        appServiceTypes: asyncSql(sql.getApp.serviceTypes[filterTypeFunc](value)),
        appServiceTypeNames: asyncSql(sql.getApp.serviceTypeNames[filterTypeFunc](value)),
        appServiceTypePermissions: asyncSql(sql.getApp.serviceTypePermissions[filterTypeFunc](value)),
        appAutoApprovals: asyncSql(sql.getApp.autoApproval[filterTypeFunc](value)),
        appBlacklist: asyncSql(sql.getApp.blacklist[filterTypeFunc](value)),
        appAdministrators: asyncSql(sql.getApp.administrators[filterTypeFunc](value)),
        appHybridPreference: asyncSql(sql.getApp.hybridPreference[filterTypeFunc](value)),
        appPassthrough: asyncSql(sql.getApp.passthrough[filterTypeFunc](value))
    };

    for (let prop in getAppObj) {
        getAppObj[prop] = await getAppObj[prop]; // resolve all promises into each property
    }

    return model.constructFullAppObjs(getAppObj);
}

async function storeCategories (categories) {
    await app.locals.db.asyncSqls(sql.upsertCategories(categories));
}

//application store functions

async function storeApps (includeApprovalStatus, notifyOEM, apps, callback) {

    async function recStore (includeApprovalStatus, theseApps) {
        //first check if the apps need to be deleted from or stored in the database
        const appResults = await Promise.all(theseApps.map(checkNeedsInsertionOrDeletion));
        let appObjs = await filterApps(includeApprovalStatus, appResults);

        //each app surviving the filter should be checked with the app_auto_approval table to see if it its status
        //should change to be accepted
        appObjs = await Promise.all(appObjs.map(autoApprovalModifier));
        appObjs = await Promise.all(appObjs.map(autoBlacklistModifier));

        const succeededAppIds = (await Promise.allSettled(appObjs.map(model.storeApp.bind(null, notifyOEM)))).map(result => result.value);
        // return all failed apps to try inserts again later
        return appObjs.filter((appObj, index) => succeededAppIds[index] === undefined).map(appObj => appObj.uuid);
    }

    const queue = await recStore(includeApprovalStatus, apps);

    if (queue.length > 0) {
        attemptRetry(300000, queue);
    }
    return;
}

//determine whether the object needs to be deleted or stored in the database
async function checkNeedsInsertionOrDeletion (appObj) {
    if (appObj.deleted_ts) {
        // delete!
        await db.asyncSql(sql.purgeAppInfo(appObj));
        // delete attempt made, skip it!
        return null;
    } else if (appObj.blacklisted_ts) {
        // blacklist!
        await db.asyncSql(sql.insertAppBlacklist(appObj));
        // blacklist attempt made, skip it!
        return null;
    } else {
        // check if the version exists in the database before attempting insertion
        const getObjStr = sql.versionCheck('app_info', {
            app_uuid: appObj.uuid,
            version_id: appObj.version_id
        });
        const data = await db.asyncSql(getObjStr);
        if (data.length > 0) {
            // record exists, skip it!
            return null;
        } else {
            return appObj;
        }
    }
}

//any elements that are null are removed
//furthermore, remove approval status here if necessary
async function filterApps (includeApprovalStatus, appObjs) {
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
    return filtered;
}

//auto changes any app's approval status to ACCEPTED if a record was found for that app's uuid in the auto approval table
async function autoApprovalModifier (appObj) {
    // check if auto-approve *all apps* is enabled
    if (config.autoApproveAllApps) {
        appObj.approval_status = 'ACCEPTED';
        appObj.encryption_required = config.autoApproveSetRPCEncryption;
        return appObj;
    }

    // check if auto-approve this specific app is enabled
    const res = await db.asyncSql(sql.checkAutoApproval(appObj.uuid));
    //if res is not an empty array, then a record was found in the app_auto_approval table
    //change the status of this appObj to ACCEPTED
    if (res.length > 0) {
        appObj.approval_status = 'ACCEPTED';
        appObj.encryption_required = config.autoApproveSetRPCEncryption;
    }
    return appObj;
}

// Auto deny new application versions of an app that is blacklisted
async function autoBlacklistModifier (appObj) {
    const res = await db.asyncSql(sql.getBlacklistedAppFullUuids(appObj.uuid));

    if (res.length > 0) {
        appObj.approval_status = 'LIMITED';
    }
    return appObj;
}

// checks a retry queue of app IDs to requery their information from SHAID and attempt insertion into the database
function attemptRetry (milliseconds, retryQueue) {
    if (milliseconds > 14400000) { // do not take longer than 4 hours
        milliseconds = 14400000;
    }
    log.error("Received app with incorrectly formatted info, will attempt to requery SHAID in " + (milliseconds / 60000) + " minutes");
    
    setTimeout(async function () {
        const appGetPromises = retryQueue.map(async appID => {
            return app.locals.shaid.getApplications({
                "uuid": appID,
                "include_deleted": true,
                "include_blacklisted": true
            });
        });

        const appArrays = await Promise.all(appGetPromises);
        let apps = [];

        appArrays.forEach(array => {
            apps = apps.concat(array);
        });

        //first check if the apps need to be deleted from or stored in the database
        const appResults = await Promise.all(apps.map(checkNeedsInsertionOrDeletion));

        let appObjs = await filterApps(false, appResults);
        //each app surviving the filter should be checked with the app_auto_approval table to see if it its status
        //should change to be accepted
        appObjs = await Promise.all(appObjs.map(autoApprovalModifier));
        appObjs = await Promise.all(appObjs.map(autoBlacklistModifier));

        const succeededAppIds = (await Promise.allSettled(appObjs.map(model.storeApp.bind(null, true)))).map(result => result.value);
        const failedAppIds = appObjs.filter((appObj, index) => succeededAppIds[index] === undefined).map(appObj => appObj.uuid);
        
        if (failedAppIds.length > 0) {
            // increase wait time for retry by a factor of 5
            attemptRetry(milliseconds * 5, failedAppIds);
        } else {
            log.info("App with previously malformed data successfully stored");
        }
    }, milliseconds);
}

async function storeAppCertificates (insertObjs) {
    await app.locals.db.asyncTransaction(async client => {
        for (const insertObj of insertObjs) {
            app.locals.log.info("Updating certificate of " + insertObj.app_uuid);
            await model.updateAppCertificate(insertObj.app_uuid, insertObj.certificate);
        }
    }).catch(err => {
        app.locals.log.error(err);
    });

    app.locals.log.info("App certificates updated");
}

async function createFailedAppsCert (failedApp, next) {
    let options = certificates.getCertificateOptions({
        serialNumber: failedApp.app_uuid,
        clientKey: failedApp.private_key
    });

    const keyBundle = await certificates.asyncCreateCertificate(options);

    const keyCertBundle = await certUtil.createKeyCertBundle(keyBundle.clientKey, keyBundle.certificate);
    
    return {
        app_uuid: failedApp.app_uuid,
        certificate: keyCertBundle
    }
}

function appStoreTransformation (min_rpc_version, min_protocol_version, apps) {
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

    return newApps;
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
