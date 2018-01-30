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
    const insertPermissions = setupSqlCommandsNoError(sql.insert.permissions(permissionObjs));
    const insertPermissionRelations = setupSqlCommandsNoError(sql.insert.permissionRelations(permissionRelationObjs));
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

function insertApps (appObjs, next) {
    const insertFlows = appObjs.map(function (appObj) {
        //store vendor first, then app obj, referencing vendor ID in the app info obj matching vendor name + email + max id
        //then add countries, display names, permissions, category, and auto approval referencing app info matching app uuid + max id
        const insertVendor = setupSqlCommandsNoError([sql.insert.vendor(appObj.vendor.name, appObj.vendor.email)])[0];
        const insertAppObj = setupSqlCommandsNoError([sql.insert.appInfo(appObj)])[0];

        const insertAppCountries = setupSqlCommandsNoError(sql.insert.appCountries(appObj));
        const insertAppDisplayNames = setupSqlCommandsNoError(sql.insert.appDisplayNames(appObj));
        const insertAppPermissions = setupSqlCommandsNoError(sql.insert.appPermissions(appObj));
        const insertAppAutoApproval = setupSqlCommandsNoError(sql.insert.appAutoApproval(appObj));
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

//given an array of SQL commands, sets up functions to execute the query
//will not propagate errors up
function setupSqlCommandsNoError (sqlStringArray) {
    return sqlStringArray.map(function (str) {
        return function (next) {
            db.sqlCommand(str, function (err, res) {
                if (err) {
                    log.error(err);
                }
                next();
            });     
        }        
    });
}

module.exports = {
    storeApps: storeApps,
    flow: flow,
    storePermissions: storePermissions
}