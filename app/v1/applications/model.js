const app = require('../app');
const db = app.locals.db;
const flow = app.locals.flow;
const flame = app.locals.flame;
const hashify = app.locals.hashify;
const arrayify = app.locals.arrayify;
const log = app.locals.log;
const sql = require('./sql.js');

//takes SQL data and converts it into a response for the UI to consume
function constructFullAppObjs (res, next) {
    //hash the below data for fast access later
    const hashedCategories = hashify({}, res.appCategories, elem => ({
        location: [elem.id],
        data: elem.display_name
    }));
    const hashedAutoApproval = hashify({}, res.appAutoApprovals, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    const hashedBlacklist = hashify({}, res.appBlacklist, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    const hashedAdministratorApps = hashify({}, res.appAdministrators, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    const hashedHybridPreference = hashify({}, res.appHybridPreference, elem => ({
        location: [elem.app_uuid],
        data: elem.hybrid_preference
    }));
    const hashedPassthrough = hashify({}, res.appPassthrough, elem => ({
        location: [elem.app_uuid],
        data: true
    }));
    // app services
    const hashedServices = {};

    hashify(hashedServices, res.appServiceTypes, elem => ({
        location: [elem.app_id, elem.service_type_name],
        data: obj => {
            obj.name = elem.service_type_name,
            obj.display_name = elem.display_name,
            obj.service_names = [],
            obj.permissions = []
        }
    }));
    hashify(hashedServices, res.appServiceTypeNames, elem => ({
        location: [elem.app_id, elem.service_type_name, "service_names"],
        data: arr => arr.push(elem.service_name)
    }));
    //filter out appServiceTypePermissions of elements that don't exist in hashedServices
    const filteredASTP = res.appServiceTypePermissions.filter(astp => {
        return (hashedServices[astp.app_id] !== undefined &&
                hashedServices[astp.app_id][astp.service_type_name] !== undefined)
    });

    hashify(hashedServices, filteredASTP, elem => ({
        location: [elem.app_id, elem.service_type_name, "permissions"],
        data: arr => arr.push({
            "app_id": elem.app_id,
            "function_id": elem.function_id,
            "display_name": elem.display_name,
            "name": elem.name,
            "is_selected": elem.is_selected
        })
    }));

    const hashedApps = hashify({}, res.appBase, appInfo => ({
        location: [appInfo.id],
        data: obj => {
            Object.assign(obj, appInfo) //move properties from appInfo into obj
            obj.uuid = appInfo.app_uuid;
            delete obj.app_uuid;
            obj.short_uuid = appInfo.app_short_uuid;
            delete obj.app_short_uuid;
            obj.category = {
                id: appInfo.category_id,
                display_name: hashedCategories[appInfo.category_id]
            }
            obj.is_auto_approved_enabled = !!hashedAutoApproval[appInfo.app_uuid]; //coerce to boolean
            obj.is_blacklisted = !!hashedBlacklist[appInfo.app_uuid]; //coerce to boolean
            obj.is_administrator_app = !!hashedAdministratorApps[appInfo.app_uuid]; //coerce to boolean
            obj.hybrid_app_preference = hashedHybridPreference[appInfo.app_uuid] || "BOTH";
            obj.allow_unknown_rpc_passthrough = !!hashedPassthrough[appInfo.app_uuid]; //coerce to boolean
            obj.countries = [];
            obj.display_names = [];
            obj.permissions = [];
            obj.services = arrayify(hashedServices, [appInfo.id]); //services should be an array
        }
    }));

    // countries
    hashify(hashedApps, res.appCountries, elem => ({
        location: [elem.id, "countries"],
        data: arr => arr.push({
            iso: elem.country_iso,
            name: elem.name
        })
    }))
    // display names
    hashify(hashedApps, res.appDisplayNames, elem => ({
        location: [elem.id, "display_names"],
        data: arr => arr.push(elem.display_text)
    }))
    // permissions
    hashify(hashedApps, res.appPermissions, elem => ({
        location: [elem.id, "permissions"],
        data: arr => arr.push({
            key: elem.permission_name,
            hmi_level: elem.hmi_level,
            type: elem.type
        })
    }))

    //convert the hash back to an array!
    let fullApps = [];
    for (let id in hashedApps) {
        fullApps.push(hashedApps[id]);
    }
    next(null, fullApps);
}


//store the information using a SQL transaction
function storeApp (appObj, next) {
    var storedApp = null;
    // process message groups synchronously (due to the SQL transaction)
    db.runAsTransaction(function (client, callback) {
        flame.async.waterfall([
            //stage 1: insert app info
            client.getOne.bind(client, sql.insertAppInfo(appObj)),
            //stage 2: insert countries, display names, permissions, and app auto approvals
            function (app, next) {
                log.info("New/updated app " + app.app_uuid + " added to the database");
                storedApp = app;
                const allInserts = [];
                if (appObj.countries.length > 0) {
                    allInserts.push(sql.insertAppCountries(appObj.countries, app.id));
                }
                if (appObj.display_names.length > 0) {
                    allInserts.push(sql.insertAppDisplayNames(appObj.display_names, app.id));
                }
                if (appObj.permissions.length > 0) {
                    allInserts.push(sql.insertAppPermissions(appObj.permissions, app.id));
                }
                if (appObj.services.length > 0) {
                    allInserts.push(sql.insertAppServices(appObj.services, app.id));
                    allInserts.push(sql.insertAppServiceNames(appObj.services, app.id));
                    allInserts.push(sql.insertStandardAppServicePermissions(appObj.services, app.id));
                }
                if (appObj.is_auto_approved_enabled) {
                    allInserts.push(sql.insertAppAutoApproval(appObj));
                }
                //execute all the sql statements. client.getOne needs client as context or the query will fail
                flame.async.series(flame.map(allInserts, client.getOne, client), next);
            },
            //stage 3: sync with shaid
            function (res, next) {
                if(!storedApp.version_id){
                    // skip sync with SHAID if no app version ID is present
                    next(null, null);
                    return;
                }
                app.locals.shaid.setApplicationApprovalVendor([storedApp], function(err, result){
                    next(err, res);
                });
            }
        ], function(err, res){
            if(err){
                callback(err, appObj.uuid);
            }
            else {
                callback(err, res);
            }
        });
    }, next);
}

module.exports = {
    constructFullAppObjs: constructFullAppObjs,
    storeApp: storeApp
}
