const sql = require('../sql');
const flow = require('../flow');
const log = require('../../custom/loggers/winston');
const db = require('../../custom/databases/postgres')(log);

//accepts an array of appObjs unlike checkNeedsInsertion
function checkNeedsInsertionArray (appObjs) {
    return appObjs.map(function (appObj) {
        return function (next) {
            checkNeedsInsertion(appObj, function (insertBool) {
                if (!insertBool) {
                    log.info("App " + appObj.uuid + " already in database.");
                    next(null, null);
                }
                else {
                    next(null, appObj);
                }
            });
        }
    });        
}

//given a timestamp of the obj to store, the table name, and a where object comparing the obj to one in the db,
//determine whether the object needs to be stored in the database
//assumes the property name of the timestamp is 'updated_ts'
function checkNeedsInsertion (appObj, next) {
    const timestamp = appObj.updated_ts;
    const tableName = 'app_info';
    const whereObj = {app_uuid: appObj.uuid};
    //compare timestamps to determine if the object passed in actually changed before insertion
    const getObjStr = sql.timestampCheck(tableName, whereObj);
    db.sqlCommand(getObjStr, function (err, data) {
        const dbTimestamp = data.rows[0].max;
        if (dbTimestamp !== null && dbTimestamp !== undefined) {
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
            //app doesn't exist!
            next(true);
        }
    });
}

//any elements that are null are removed
function filterApps (appObjs, next) {
    const filtered = appObjs.filter(function (appObj) {
        return appObj !== null;
    });
    next(null, filtered);
}

function insertApps (appObjs, next) {
    const insertFlows = appObjs.map(function (appObj) {
        //store vendor first, then app obj, referencing vendor ID in the app info obj matching vendor name + email + max id
        //then add countries, displaynames, permissions referencing app info matching app uuid + max id
        //single insert
        const insertVendor = setupSqlCommandsNoError([sql.insert.vendor(appObj.vendor.name, appObj.vendor.email)])[0];
        const insertAppObj = setupSqlCommandsNoError([sql.insert.appInfo(appObj)])[0];
        //arrays of inserts
        const insertAppCountries = setupSqlCommandsNoError(sql.insert.appCountries(appObj));
        const insertAppDisplayNames = setupSqlCommandsNoError(sql.insert.appDisplayNames(appObj));
        const insertAppPermissions = setupSqlCommandsNoError(sql.insert.appPermissions(appObj));

        console.log(sql.insert.vendor(appObj.vendor.name, appObj.vendor.email));
        console.log(sql.insert.appInfo(appObj));
        console.log(sql.insert.appInfo(appObj));
        sql.insert.appCountries(appObj).map(function(g){console.log(g)});
        sql.insert.appDisplayNames(appObj).map(function(g){console.log(g)});
        sql.insert.appPermissions(appObj).map(function(g){console.log(g)});

        //setup all the inserts and return the final flow!
        const miscInsertFlow = flow(insertAppCountries.concat(insertAppDisplayNames).concat(insertAppPermissions), {method: 'parallel'}, function (err, res, next) {
            next(); //pass nothing
        });

        return flow([insertVendor, insertAppObj, miscInsertFlow, print], {method: 'waterfall'});          
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
    checkNeedsInsertionArray: checkNeedsInsertionArray,
    filterApps: filterApps,
    insertApps: insertApps
}