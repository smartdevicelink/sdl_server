const async = require('async');
const sql = require('sql-bricks');
let app; //to be defined

module.exports = function (appObj) {
    app = appObj;
    return {
        createFunctionalGroupObject: createFunctionalGroupObject
    };
}

//TODO: find a way to cache these results so additionaly queries to the DB aren't needed
//unless an update happens to the functional groups
//TODO: make the functional groups in PRODUCTION by default

//takes in data from the DB and converts it into functional groups that can be assigned to apps
function createFunctionalGroupObject (callback) {
    async.waterfall([
        function (next) {
            //get all the function group infos' property names with the highest id
            const groupedFuncGroupInfoStr = sql.select('property_name', 'status', 'max(id) AS id')
                .from('function_group_info')
                .groupBy('property_name', 'status').toString();

            //TODO: be able to specify STAGING or PRODUCTION when we add the routing for this
            const fullFuncGroupInfoStr = sql.select('function_group_info.*')
                .from('(' + groupedFuncGroupInfoStr + ') group_fgi')
                .join('function_group_info', {'function_group_info.id': 'group_fgi.id'})
                .where({'group_fgi.status': 'STAGING'}).toString();

            app.locals.db.sqlCommand(fullFuncGroupInfoStr, function (err, funcGroups) {
                next(err, funcGroups.rows);

            });
        },
        function (funcGroups, next) {
            //get ALL of the permission data
            const rpcPermissionStr = sql.select('*').from('rpc_permission').toString();
            const vehiclePermissionStr = sql.select('*').from('rpc_vehicle_parameters').toString();
            const rpcNamesStr = sql.select('*').from('rpc_names').toString();
            const vehicleNamesStr = sql.select('*').from('vehicle_data').toString();

            async.parallel({
                rpcPerms: function (next) {
                    app.locals.db.sqlCommand(rpcPermissionStr, function (err, data) {
                        next(err, data.rows);
                    });                   
                },
                vehiclePerms: function (next) {
                    app.locals.db.sqlCommand(vehiclePermissionStr, function (err, data) {
                        next(err, data.rows);
                    });
                },
                rpcNames: function (next) {
                    app.locals.db.sqlCommand(rpcNamesStr, function (err, data) {
                        next(err, data.rows);
                    });                    
                },
                vehicleDataNames: function (next) {
                    app.locals.db.sqlCommand(vehicleNamesStr, function (err, data) {
                        next(err, data.rows);
                    });                    
                },
            }, function (err, results) {
                next(err, funcGroups, results);
            });            
        },
        function (funcGroups, results, next) {
            //organize the data so that it is in JSON the way the policy table wants it
            let functionalGroupObj = {};
            for (let i = 0; i < funcGroups.length; i++) {
                let funcGroup = funcGroups[i];
                functionalGroupObj[funcGroup.property_name] = {
                    rpcs: null
                };
                if (funcGroup.user_consent_prompt) {
                    functionalGroupObj[funcGroup.property_name].user_consent_prompt = funcGroup.user_consent_prompt;
                }
            }

            const rpcPerms = results.rpcPerms;
            const vehiclePerms = results.vehiclePerms;
            const rpcNames = results.rpcNames;
            const vehicleDataNames = results.vehicleDataNames;
            //bring all the data together to form a functional groups object meant for the policy table
            //convert all permission IDs to their full form and attach them to the functional group object
            let tasks = [];
            for (let i = 0; i < rpcPerms.length; i++) {
                tasks.push(function (next) {
                    const rpcPerm = rpcPerms[i];
                    const funcPropName = findObjByProperty(funcGroups, 'id', rpcPerm.function_group_id).property_name;
                    const rpcName = findObjByProperty(rpcNames, 'id', rpcPerm.rpc_id).rpc_name;
                    if (functionalGroupObj[funcPropName].rpcs === null) { //null check
                        functionalGroupObj[funcPropName].rpcs = {};
                    }
                    functionalGroupObj[funcPropName].rpcs[rpcName] = {}; //leave empty  
                    next();               
                });
            }

            for (let i = 0; i < vehiclePerms.length; i++) {
                tasks.push(function (next) {
                    const vehiclePerm = vehiclePerms[i];
                    const funcPropName = findObjByProperty(funcGroups, 'id', vehiclePerm.function_group_id).property_name;
                    const rpcName = findObjByProperty(rpcNames, 'id', vehiclePerm.rpc_id).rpc_name;
                    const vehicleDataName = findObjByProperty(vehicleDataNames, 'id', vehiclePerm.vehicle_id).component_name;
                    if (functionalGroupObj[funcPropName].rpcs === null) { //null checks
                        functionalGroupObj[funcPropName].rpcs = {};
                        functionalGroupObj[funcPropName].rpcs[rpcName] = {};
                        functionalGroupObj[funcPropName].rpcs[rpcName].parameters = [];
                    }
                    if (functionalGroupObj[funcPropName].rpcs[rpcName] === undefined) {
                        functionalGroupObj[funcPropName].rpcs[rpcName] = {};
                        functionalGroupObj[funcPropName].rpcs[rpcName].parameters = [];
                    }
                    if (functionalGroupObj[funcPropName].rpcs[rpcName].parameters === undefined) {
                        functionalGroupObj[funcPropName].rpcs[rpcName].parameters = [];
                    }
                    functionalGroupObj[funcPropName].rpcs[rpcName].parameters.push(vehicleDataName);                    
                    next();               
                });
            }
            async.parallel(tasks, function (err) {
                next(err, functionalGroupObj, rpcNames, vehicleDataNames);
            });
        },
        function (functionalGroupObj, rpcNames, vehicleDataNames, next) {
            //the object is constructed! pass it to a custom policy builder module in case any last-second finishes need to be made
            //this is how HMI_LEVELs can be added, for instance
            app.locals.builder.modifyFunctionalGroupObject(functionalGroupObj, rpcNames, vehicleDataNames, function (funcGroupObj) {
                next(null, funcGroupObj);
            });
        }
    ], function (err, functionalGroupObj) {
        if (err) {
            app.locals.log.error(err);
        }
        //send it back!
        callback(functionalGroupObj);
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