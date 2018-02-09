const sql = require('../sql');
const flow = require('../flow');
const log = require('../../custom/loggers/winston');
const db = require('../../custom/databases/postgres')(log);

function storeApps (includeApprovalStatus) {
    return function (apps, next) {
        //setup a function for each app to store them all in the database
        //first check if the apps need to be stored in the database
        const updateCheckFlow = flow(checkNeedsInsertionArray(apps), {method: "parallel"});
        //each app surviving the filter should be checked with the app_auto_approval table to see if it its status
        //should change to be accepted
        const fullFlow = flow([
            updateCheckFlow, 
            filterApps(includeApprovalStatus), 
            autoApprovalModifier,
            convertAppObjsJson,
            insertApps
        ], {method: "waterfall"});

        fullFlow(function (err, res) {
            if (err) {
                log.error(err);
            }
            next(null, apps.length); //pass back how many applications there were
        });
    }
}

function storePermissions (permissions, next) {
    //convert the data into objects that can be directly stored in the database
    let permissionObjs = [];
    let permissionRelationObjs = [];
    for (let i = 0; i < permissions.length; i++) {
        const perm = permissions[i];
        permissionObjs.push({ //add permission
            name: perm.key,
            type: perm.type
        });
        if (perm.parent_permissions.length > 0) {
            for (let j = 0; j < perm.parent_permissions.length; j++) {
                permissionRelationObjs.push({ //add permission relation
                    child_permission_name: perm.key,
                    parent_permission_name: perm.parent_permissions[j].key
                });
            }
        }
    }

    //insert permissions first, then permission relations
    const insertPermissions = sql.setupSqlInsertsNoError(sql.insert.permissions(permissionObjs));
    const insertPermissionRelations = sql.setupSqlInsertsNoError(sql.insert.permissionRelations(permissionRelationObjs));
    const insertArray = [
        flow(insertPermissions, {method: 'parallel'}),
        flow(insertPermissionRelations, {method: 'parallel'})
    ];
    const insertFlow = flow(insertArray, {method: 'series'});
    insertFlow(function () {
        next(); //done
    });
}

//accepts an array of appObjs unlike checkNeedsInsertion
function checkNeedsInsertionArray (appObjs) {
    return appObjs.map(function (appObj) {
        return function (next) {
            checkNeedsInsertion(appObj, function (insertBool) {
                if (!insertBool) {
                    //log.info("App " + appObj.uuid + " already in database.");
                    next(null, null);
                }
                else {
                    next(null, appObj);
                }
            });
        }
    });        
}

//determine whether the object needs to be stored in the database
function checkNeedsInsertion (appObj, next) {
    const timestamp = appObj.updated_ts;
    const tableName = 'app_info';
    const whereObj = {app_uuid: appObj.uuid};
    //compare timestamps to determine if the object passed in actually changed before insertion
    const getObjStr = sql.timestampCheck(tableName, whereObj);
    db.sqlCommand(getObjStr, function (err, data) {
        const dbTimestamp = data[0].max;
        if (dbTimestamp !== null && dbTimestamp !== undefined && timestamp !== null && timestamp !== undefined) {
            const incomingDate = new Date(timestamp);
            const currentDate = new Date(dbTimestamp);
            if (incomingDate > currentDate) {
                //the app in the policy server's database is outdated! 
                next(true);
            }
            else { //app is already there
                next(false);
            }
        }
        else {
            //app doesn't exist, or has missing timestamp information! add the app
            next(true);
        }
    });
}

//any elements that are null are removed
//furthermore, remove approval status here if necessary
function filterApps (includeApprovalStatus) {
    return function (appObjs, next) {
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
}

function autoApprovalModifier (appObjs, next) {
    const appObjsMap = appObjs.map(function (appObj) {
        return function (next) {
            const sqlAutoApprovalCheck = sql.setupSqlCommand(sql.checkAutoApproval(appObj.uuid));
            sqlAutoApprovalCheck(function (err, res) {
                //if res is not an empty array, then a record was found in the app_auto_approval table
                //change the status of this appObj to ACCEPTED
                if (res.length > 0) {
                    appObj.approval_status = 'ACCEPTED';
                }
                next(null, appObj);
            });
        }
    }); 

    flow(appObjsMap, {method: 'parallel'})(function (err, res) {
        next(null, res);
    });
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
    const insertVendors = flow(sql.setupSqlCommands(sql.insert.vendors(appPieces.vendors)), {method: 'parallel'});
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
        const insertBaseApps = flow(sql.setupSqlCommands(sql.insert.appInfo(appPieces.baseApps)), {method: 'parallel'});
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
            const insertAppCountries = sql.setupSqlCommands(sql.insert.appCountries(appPieces.appCountries));
            const insertAppDisplayNames = sql.setupSqlCommands(sql.insert.appDisplayNames(appPieces.appDisplayNames));
            const insertAppPermissions = sql.setupSqlCommands(sql.insert.appPermissions(appPieces.appPermissions));
            const insertAppAutoApproval = sql.setupSqlCommands(sql.insert.appAutoApprovals(appPieces.appAutoApprovals));
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

/*
function insertApps (appObjs, next) {
    const insertFlows = appObjs.map(function (appObj) {
        //store vendor first, then app obj, referencing vendor ID in the app info obj matching vendor name + email + max id
        //then add countries, display names, permissions, category, and auto approval referencing app info matching app uuid + max id
        const insertVendor = sql.setupSqlInsertsNoError([sql.insert.vendor(appObj.vendor.name, appObj.vendor.email)])[0];
        const insertAppObj = sql.setupSqlInsertsNoError([sql.insert.appInfo(appObj)])[0];

        const insertAppCountries = sql.setupSqlInsertsNoError(sql.insert.appCountries(appObj));
        const insertAppDisplayNames = sql.setupSqlInsertsNoError(sql.insert.appDisplayNames(appObj));
        const insertAppPermissions = sql.setupSqlInsertsNoError(sql.insert.appPermissions(appObj));
        const insertAppAutoApproval = sql.setupSqlInsertsNoError(sql.insert.appAutoApproval(appObj));
        //no insert to categories needed: the info is part of the app info object
        const flowInsertArray = insertAppCountries.concat(insertAppDisplayNames).concat(insertAppPermissions).concat(insertAppAutoApproval);
        //setup all the inserts and return the final flow!
        const miscInsertFlow = flow(flowInsertArray, {method: 'parallel'});
        
        return flow([insertVendor, insertAppObj, miscInsertFlow, print], {method: 'series'});          
        function print (cb) {
            log.info("New/updated app " + appObj.uuid + " added to the database");
            cb();
        }  
    });
    //execute the array of flows!
    flow(insertFlows, {method: 'parallel'})(function (err, res) {
        if (err) {
            log.error(err);
        }
        next();        
    });          
}
*/

module.exports = {
    storeApps: storeApps,
    flow: flow,
    storePermissions: storePermissions
}