const async = require('async');
const sql = require('sql-bricks');
let app; //to be defined
const ERROR_NO_PERMITTED_APPS = "No permitted app ids";

module.exports = function (appObj) {
    app = appObj;
    return {
        createPolicyObject: createPolicyObject
    };
}

function createPolicyObject (appPolicies, callback) {
    //for each app id present, get its app id info from the DB, add that info to the policy object, and assign appropriate
    //functional groups to that app id

    //TODO: organize this mess
    
    //get DB information first
    async.waterfall([
        function (next) {
            //get the latest versions of the app ids that aren't denied
            const groupedAppInfoStr = sql.select('app_uuid', 'approval_status', 'max(id) AS id')
                .from('app_info')
                .groupBy('app_uuid', 'approval_status').toString();

            const fullAppInfoStr = sql.select('app_info.*')
                .from('(' + groupedAppInfoStr + ') group_ai')
                .join('app_info', {'app_info.id': 'group_ai.id'})
                .where(sql.not(sql.in('app_info.approval_status', ['DENIED'])))
                //additional where statement where we check against the appPolicy IDs
                .toString();

            app.locals.db.sqlCommand(fullAppInfoStr, function (err, appInfo) {
                next(err, appInfo.rows);
            });
        },
        function (appInfo, next) {
            //filter out app ids that don't exist in the appPolicies object
            const filteredAppInfo = appInfo.filter(function (oneApp) {
                for (let appId in appPolicies) {
                    if (appId === oneApp.app_uuid) {
                        return true;
                    }
                }
                return false;
            });
            if (filteredAppInfo.length === 0) {
                //there's no permitted app ids. exit out early
                next(ERROR_NO_PERMITTED_APPS, filteredAppInfo);
            }
            else {
                //assign empty arrays that will be used to put information in later
                for (let i = 0; i < appInfo.length; i++) {
                    appInfo[i].display_names = [];
                    appInfo[i].vehiclePermissions = [];
                    appInfo[i].rpcPermissions = [];
                }
                next(null, filteredAppInfo);
            }
        },
        function (appInfo, next) {
            //appInfo now has all and only the information needed to be put in the response
            const appInfoIds = appInfo.map(function (oneApp) {
                return oneApp.id;
            });
            //get the display names whose ids only match those from the ids in appInfo
            const displayNameFilterStr = sql.select('*').from('display_names')
                .where(sql.in('app_id', appInfoIds))
                .toString();

            app.locals.db.sqlCommand(displayNameFilterStr, function (err, data) {
                //associate the display names with the correct appInfo
                const displayNamesTasks = data.rows.map(function (displayName) {
                    return function (next) {
                        let appObj = findObjByProperty(appInfo, 'id', displayName.app_id);
                        appObj.display_names.push(displayName.display_text);
                        next();
                    }
                });
                async.parallel(displayNamesTasks, function (err) {
                    next(err, appInfo, appInfoIds);
                }); 
            });   
        },
        function (appInfo, appInfoIds, next) {            
            //we need permission associations for each app in appInfo and the permissions' full names
            const vehiclePermsFilterStr = sql.select('*').from('app_vehicle_permissions')
                .where(sql.in('app_id', appInfoIds))
                .toString();

            const fullVehiclePermsFilterStr = sql.select('*')
                .from('(' + vehiclePermsFilterStr + ') group_vp')
                .innerJoin('vehicle_data', {'group_vp.vehicle_id': 'vehicle_data.id'})
                .toString();

            app.locals.db.sqlCommand(fullVehiclePermsFilterStr, function (err, data) {
                const vehiclePermsTasks = data.rows.map(function (vehiclePerm) {
                    return function (next) {
                        let appObj = findObjByProperty(appInfo, 'id', vehiclePerm.app_id);
                        appObj.vehiclePermissions.push(vehiclePerm.component_name);
                        next();
                    }
                });
                async.parallel(vehiclePermsTasks, function (err) {
                    next(err, appInfo, appInfoIds);
                }); 
            });
        },
        function (appInfo, appInfoIds, next) {            
            const rpcPermsFilterStr = sql.select('*').from('app_rpc_permissions')
                .where(sql.in('app_id', appInfoIds))
                .toString();

            const fullRpcPermsFilterStr = sql.select('*')
                .from('(' + rpcPermsFilterStr + ') group_rp')
                .innerJoin('rpc_names', {'group_rp.rpc_id': 'rpc_names.id'})
                .toString();
            
            app.locals.db.sqlCommand(fullRpcPermsFilterStr, function (err, data) {
                const rpcPermsTasks = data.rows.map(function (rpcPerm) {
                    return function (next) {
                        let appObj = findObjByProperty(appInfo, 'id', rpcPerm.app_id);
                        appObj.rpcPermissions.push(rpcPerm.rpc_name);
                        next();
                    }
                });
                async.parallel(rpcPermsTasks, function (err) {
                    next(err, appInfo);
                }); 
            });
        }
    ], function (err, appInfo) {
        if (err) {
            //it's not technically an error if the cause was because no app ids were permitted
            if (err !== ERROR_NO_PERMITTED_APPS) {
                app.locals.log.error(err);
            }
        }
        if (appInfo === null || appInfo === undefined) {
            appInfo = [];
        }
        findPermissionsForApps(appInfo);
    });
    function findPermissionsForApps (appInfo) {
        //make a new policy object 
        let appPolicyResponse = {};
        for (let i = 0; i < appInfo.length; i++) {
            appPolicyResponse[appInfo[i].app_uuid] = null;
        }        
        //allow a pre-run through the app policy object first to handle the scenarios where
        //that app doesn't receive approval. the default behavior is that the app id is set to the "default"
        //app policy, which uses the "Base-4" function group
        app.locals.builder.preRunAppPolicyObject(appPolicyResponse);
        //TESTING

        //to respond with the app policies object, just modify the one that came in through the request
        let tasks = [];
        for (let i = 0; i < appInfo.length; i++) {
            tasks.push(function (next) {
                const oneApp = appInfo[i];
                appPolicyResponse[oneApp.app_uuid] = app.locals.builder.createAppPolicyObject(oneApp);
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

function findObjByProperty (array, propName, value) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][propName] === value) {
            return array[i];
        }
    }
    return null;
}