const app = require('../app');
const db = app.locals.db;
const flow = app.locals.flow;
const log = app.locals.log;
const sql = require('./sql.js');

//takes SQL data and converts it into a response for the UI to consume
function constructFullAppObjs (res, next) {
    const appBase = res[0];
    const appCountries = res[1];
    const appDisplayNames = res[2];
    const appPermissions = res[3];
    const appVendors = res[4];
    const appCategories = res[5];
    const appAutoApprovals = res[6];

    //convert appCategories and appAutoApprovals to hash by id
    const hashedCategories = {};
    const hashedAutoApproval = {};

    for (let i = 0; i < appCategories.length; i++) {
        hashedCategories[appCategories[i].id] = appCategories[i].display_name;
    }
    for (let i = 0; i < appAutoApprovals.length; i++) {
        hashedAutoApproval[appAutoApprovals[i].app_uuid] = true;
    }

    //convert appBase to hash by id for fast assignment of other information
    const hashedApps = {};
    for (let i = 0; i < appBase.length; i++) {
        hashedApps[appBase[i].id] = appBase[i];
        hashedApps[appBase[i].id].uuid = hashedApps[appBase[i].id].app_uuid;
        hashedApps[appBase[i].id].category = {
            id: appBase[i].category_id,
            display_name: hashedCategories[appBase[i].category_id]
        };
        if (hashedAutoApproval[appBase[i].app_uuid]) {
            hashedApps[appBase[i].id].is_auto_approved_enabled = true;
        }
        else {
            hashedApps[appBase[i].id].is_auto_approved_enabled = false;
        }
        delete hashedApps[appBase[i].id].app_uuid;
        hashedApps[appBase[i].id].countries = [];
        hashedApps[appBase[i].id].display_names = [];
        hashedApps[appBase[i].id].permissions = [];
    }
    //iterate through all other info and attach their information to hashedApps
    for (let i = 0; i < appCountries.length; i++) {
        hashedApps[appCountries[i].id].countries.push({
            iso: appCountries[i].country_iso,
            name: appCountries[i].name
        });
    }
    for (let i = 0; i < appDisplayNames.length; i++) {
        hashedApps[appDisplayNames[i].id].display_names.push(appDisplayNames[i].display_text);
    }
    for (let i = 0; i < appPermissions.length; i++) {
        hashedApps[appPermissions[i].id].permissions.push({
            key: appPermissions[i].permission_name,
            hmi_level: appPermissions[i].hmi_level,
            type: appPermissions[i].type
        });
    }
    for (let i = 0; i < appVendors.length; i++) {
        hashedApps[appVendors[i].id].vendor = {
            id: appVendors[i].id,
            name: appVendors[i].vendor_name,
            email: appVendors[i].vendor_email
        };
    }

    //convert the hash back to an array!
    let fullApps = [];
    for (let id in hashedApps) {
        fullApps.push(hashedApps[id]);
    }
    next(null, fullApps);
}

//breaks down an array of app objects into a bunch of smaller objects meant for sql insertion
function convertAppObjsJson (appObjs, next) {
    //separate out all the objects into groups of similar data, stored in arrays
    let vendors = [];
    let baseApps = [];
    let appCountries = [];
    let appDisplayNames = [];
    let appPermissions = [];
    let appAutoApprovals = [];

    for (let i = 0; i < appObjs.length; i++) {
        const appObj = appObjs[i];
        appObj.TEMP_ID = i;
        //attach a unique value to each app object, and link all the subsets 
        //of information to that id for future reference
        vendors.push({
            TEMP_ID: appObj.TEMP_ID,
            vendor_name: appObj.vendor.name,
            vendor_email: appObj.vendor.email
        });
        baseApps.push(appObj); //link to vendors using unique id
        for (let j = 0; j < appObj.countries.length; j++) {
            appCountries.push({ //link to base apps using unique id
                TEMP_ID: appObj.TEMP_ID,
                country_iso: appObj.countries[j].iso
            });             
        }
        for (let j = 0; j < appObj.display_names.length; j++) {
            appDisplayNames.push({ //link to base apps using unique id
                TEMP_ID: appObj.TEMP_ID,
                display_text: appObj.display_names[j]
            });             
        }
        for (let j = 0; j < appObj.permissions.length; j++) {
            appPermissions.push({ //link to base apps using unique id
                TEMP_ID: appObj.TEMP_ID,
                permission_name: appObj.permissions[j].key,
                hmi_level: appObj.permissions[j].hmi_level
            });             
        }
        if (appObj.is_auto_approved_enabled) {
            appAutoApprovals.push(appObj);
        }
    }    
    next(null, {
        vendors: vendors,
        baseApps: baseApps,
        appCountries: appCountries,
        appDisplayNames: appDisplayNames,
        appPermissions: appPermissions,
        appAutoApprovals: appAutoApprovals
    });
}

function insertApps (appPieces, next) {
    //stage 1: insert vendors
    const insertVendors = flow(db.setupSqlCommands(sql.insertVendors(appPieces.vendors)), {method: 'parallel'});
    //NOTE: relies on the order of the inserts being the same as the returning values
    insertVendors(function (err, res) {
        //flatten the nested arrays to get one array of vendors
        const newVendors = res.map(function (elem) {
            return elem[0];
        });
        //map temp ids to new vendor ids
        let tempIdToNewVendorIdHash = {}; //temp id to new id
        for (let i = 0; i < newVendors.length; i++) {
            tempIdToNewVendorIdHash[appPieces.vendors[i].TEMP_ID] = newVendors[i].id;
        }
        //add vendor id to each app object
        for (let i = 0; i < appPieces.baseApps.length; i++) {
            appPieces.baseApps[i].vendor_id = tempIdToNewVendorIdHash[appPieces.baseApps[i].TEMP_ID];
        }
        //stage 2: insert app objects
        const insertBaseApps = flow(db.setupSqlCommands(sql.insertAppInfo(appPieces.baseApps)), {method: 'parallel'});
        insertBaseApps(function (err, res) {
            //flatten the nested arrays to get one array of app objs
            const newBaseApps = res.map(function (elem) {
                log.info("New/updated app " + elem[0].app_uuid + " added to the database");
                return elem[0];
            });
            //map temp ids to new base apps ids
            let tempIdToNewIdHash = {}; //temp id to new id
            for (let i = 0; i < newBaseApps.length; i++) {
                tempIdToNewIdHash[appPieces.baseApps[i].TEMP_ID] = newBaseApps[i].id;
            }            
            //add the base app id to countries, display names, and permissions. app auto approval doesn't need it
            for (let i = 0; i < appPieces.appCountries.length; i++) {
                appPieces.appCountries[i].id = tempIdToNewIdHash[appPieces.appCountries[i].TEMP_ID];
            }    
            for (let i = 0; i < appPieces.appDisplayNames.length; i++) {
                appPieces.appDisplayNames[i].id = tempIdToNewIdHash[appPieces.appDisplayNames[i].TEMP_ID];
            }    
            for (let i = 0; i < appPieces.appPermissions.length; i++) {
                appPieces.appPermissions[i].id = tempIdToNewIdHash[appPieces.appPermissions[i].TEMP_ID];
            }            
            //stage 3: insert countries, display names, permissions, and app auto approvals
            const insertAppCountries = db.setupSqlCommands(sql.insertAppCountries(appPieces.appCountries));
            const insertAppDisplayNames = db.setupSqlCommands(sql.insertAppDisplayNames(appPieces.appDisplayNames));
            const insertAppPermissions = db.setupSqlCommands(sql.insertAppPermissions(appPieces.appPermissions));
            const insertAppAutoApproval = db.setupSqlCommands(sql.insertAppAutoApprovals(appPieces.appAutoApprovals));
            //no insert to categories needed: the info is part of the app info object
            const flowInsertArray = insertAppCountries.concat(insertAppDisplayNames).concat(insertAppPermissions).concat(insertAppAutoApproval);
            //setup all the inserts and return the final flow!
            const miscInsertFlow = flow(flowInsertArray, {method: 'parallel'});        
            miscInsertFlow(function (err, res) {
                next(); //done
            });
        });        
    });    
}

module.exports = {
    constructFullAppObjs: constructFullAppObjs,
    convertAppObjsJson: convertAppObjsJson,
    insertApps: insertApps
}