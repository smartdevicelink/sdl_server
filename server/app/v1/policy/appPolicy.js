const async = require('async');
const sql = require('sql-bricks');
let app; //to be defined
const ERROR_NO_NEW_PERMITTED_APPS = "No new permitted app ids";
let appPolicyCache = {}; //store app policy objects here to prevent extra requests to the database

module.exports = function (appObj) {
    app = appObj;
    return {
        createPolicyObject: createPolicyObject
    };
}

function createPolicyObject (appPolicies, callback) {
    //for each app id present, get its app id info from the DB, add that info to the policy object, and assign appropriate
    //functional groups to that app id

    //make a cached policy object 
    let cachedAppPolicyResponse = {};

    //get DB information
    async.waterfall([
        function (next) {
            //get the latest versions of the app ids that aren't denied
            getAppIds(['PENDING', 'ACCEPTED'], next);
        },
        function (appInfo, next) {
            //filter out app ids that don't exist in the appPolicies object and that exist in the cache
            const filteredAppInfo = appInfo.filter(function (oneApp) {
                for (let appId in appPolicies) {
                    if (appId === oneApp.app_uuid) {
                        if (appPolicyCache[oneApp.app_uuid]) {
                            cachedAppPolicyResponse[oneApp.app_uuid] = appPolicyCache[oneApp.app_uuid];
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                }
                return false;
            });
            //assign empty arrays to the rest of the apps that will be used to put information in later
            for (let i = 0; i < filteredAppInfo.length; i++) {
                filteredAppInfo[i].display_names = [];
                filteredAppInfo[i].vehiclePermissions = [];
                filteredAppInfo[i].rpcPermissions = [];
            }
            if (filteredAppInfo.length === 0) {
                //there's no noncached app ids. exit out early
                next(ERROR_NO_NEW_PERMITTED_APPS, []);
            }
            else {
                next(null, filteredAppInfo);
            }
        },
        function (appInfo, next) {
            //appInfo now has all and only the information that needs extra data from the database
            attachDisplayNamesToAppIds(appInfo, next);  
        },
        function (appInfo, next) {            
            //we need permission associations for each app in appInfo and the permissions' full names
            attachVehiclePermissionsToAppIds(appInfo, next);
        },
        function (appInfo, next) {    
            attachRpcPermissionsToAppIds(appInfo, next);
        }
    ], function (err, appInfo) {
        if (err) {
            //it's not technically an error if the cause was because no new app ids were permitted
            if (err !== ERROR_NO_NEW_PERMITTED_APPS) {
                app.locals.log.error(err);
            }
        }
        if (appInfo === null || appInfo === undefined) {
            appInfo = [];
        }
        findPermissionsForApps(appInfo);
    });
    function findPermissionsForApps (appInfo) {
        //initialize the response object
        let appPolicyResponse = {};
        for (let i = 0; i < appInfo.length; i++) {
            //set the app uuids to null for those without a cached object
            appPolicyResponse[appInfo[i].app_uuid] = null;
        }        
        //allow a pre-run through the app policy object first to handle the scenarios where
        //that app doesn't receive approval. the default behavior is that the app id is set to the "default"
        //app policy, which uses the "Base-4" function group
        app.locals.builder.preRunAppPolicyObject(appPolicyResponse);

        //store the cached app ids found into the response
        for (let appId in cachedAppPolicyResponse) {
            appPolicyResponse[appId] = cachedAppPolicyResponse[appId];
        }

        //to respond with the app policies object, just modify the one that came in through the request
        let tasks = [];
        for (let i = 0; i < appInfo.length; i++) {
            tasks.push(function (next) {
                const oneApp = appInfo[i];
                //cache the result for future requests
                appPolicyCache[oneApp.app_uuid] = app.locals.builder.createAppPolicyObject(oneApp); 
                appPolicyResponse[oneApp.app_uuid] = appPolicyCache[oneApp.app_uuid];
                next();                  
            });
        }        
        async.parallel(tasks, function (err) {
            if (err) {
                app.locals.log.error(err);
            }
            callback(appPolicyResponse);
        })
    }
}

function getAppIds (approvalStatusArray, callback) {
    //get the latest versions of the app ids
    const groupedAppInfoStr = sql.select('app_uuid', 'approval_status', 'max(id) AS id')
        .from('app_info')
        .groupBy('app_uuid', 'approval_status').toString();

    const fullAppInfoStr = sql.select('app_info.*')
        .from('(' + groupedAppInfoStr + ') group_ai') 
        .join('app_info', {'app_info.id': 'group_ai.id'})
        .where(sql.in('app_info.approval_status', approvalStatusArray))
        //additional where statement where we check against the appPolicy IDs
        .toString();

    app.locals.db.sqlCommand(fullAppInfoStr, function (err, appInfo) {
        callback(err, appInfo.rows);
    });
}

function attachDisplayNamesToAppIds (appInfo, callback) {
    //get the display names whose ids only match those from the ids in appInfo
    const displayNameFilterStr = constructQueryFilter(appInfo, 'display_names');

    attachDataToAppInfo(appInfo, displayNameFilterStr, 'display_names', 'display_text', callback);  
}

function attachVehiclePermissionsToAppIds (appInfo, callback) {
    const vehiclePermsFilterStr = constructQueryFilter(appInfo, 'app_vehicle_permissions');

    const fullVehiclePermsFilterStr = sql.select('*')
        .from('(' + vehiclePermsFilterStr + ') group_vp')
        .innerJoin('vehicle_data', {'group_vp.vehicle_id': 'vehicle_data.id'})
        .toString();

    attachDataToAppInfo(appInfo, fullVehiclePermsFilterStr, 'vehiclePermissions', 'component_name', callback);     
}

function attachRpcPermissionsToAppIds (appInfo, callback) {
    const rpcPermsFilterStr = constructQueryFilter(appInfo, 'app_rpc_permissions');

    const fullRpcPermsFilterStr = sql.select('*')
        .from('(' + rpcPermsFilterStr + ') group_rp')
        .innerJoin('rpc_names', {'group_rp.rpc_id': 'rpc_names.id'})
        .toString();

    attachDataToAppInfo(appInfo, fullRpcPermsFilterStr, 'rpcPermissions', 'rpc_name', callback);     
}

function constructQueryFilter (appInfo, tableName) {
    const appInfoIds = appInfo.map(function (oneApp) {
        return oneApp.id;
    });

    return sql.select('*').from(tableName)
        .where(sql.in('app_id', appInfoIds))
        .toString();    
}

function attachDataToAppInfo (appInfo, sqlQuery, appObjProp, datumProp, callback) {
    app.locals.db.sqlCommand(sqlQuery, function (err, data) {
        const dataTasks = data.rows.map(function (datum) {
            return function (next) {
                let appObj = findObjByProperty(appInfo, 'id', datum.app_id);
                appObj[appObjProp].push(datum[datumProp]);
                next();
            }
        });
        async.parallel(dataTasks, function (err) {
            callback(err, appInfo);
        }); 
    });
}

function findObjByProperty (array, propName, value) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][propName] === value) {
            return array[i];
        }
    }
    return null;
}