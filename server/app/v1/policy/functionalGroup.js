const async = require('async');
const sql = require('sql-bricks');
let app; //to be defined
let exportedFunctionalGroupObj;

module.exports = function (appObj) {
    app = appObj;
    return {
        createFunctionalGroupObject: createFunctionalGroupObject,
        getFunctionalGroup: function () {
            return exportedFunctionalGroupObj;
        }
    };
}

//TODO: find a way to cache these results so additionaly queries to the DB aren't needed
//unless an update happens to the functional groups. do it on the update start cycle when the server turns on!
//the other stuff can't update until a server restart anyway

//TODO: make the functional groups in PRODUCTION by default

//takes in data from the DB and converts it into functional groups that can be assigned to apps
function createFunctionalGroupObject (callback) {
    async.waterfall([
        function (next) {
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
                //hash the ids of permissions and functional groups for easy lookup to their properties
                rpcNameHash: function (next) {
                    app.locals.db.sqlCommand(rpcNamesStr, function (err, data) {
                        let hash = {};
                        for (let i = 0; i < data.rows.length; i++) {
                            hash[data.rows[i].id] = data.rows[i].rpc_name;
                        }
                        next(err, hash);
                    });                    
                },
                vehicleDataNameHash: function (next) {
                    app.locals.db.sqlCommand(vehicleNamesStr, function (err, data) {
                        let hash = {};
                        for (let i = 0; i < data.rows.length; i++) {
                            hash[data.rows[i].id] = data.rows[i].component_name;
                        }
                        next(err, hash);
                    });                    
                },
                funcGroupHash: function (next) {
                    //get all the function group infos' property names with the highest id
                    const groupedFuncGroupInfoStr = sql.select('property_name', 'status', 'max(id) AS id')
                        .from('function_group_info')
                        .groupBy('property_name', 'status').toString();

                    //TODO: be able to specify STAGING or PRODUCTION when we add the routing for this
                    const fullFuncGroupInfoStr = sql.select('function_group_info.*')
                        .from('(' + groupedFuncGroupInfoStr + ') group_fgi')
                        .join('function_group_info', {'function_group_info.id': 'group_fgi.id'})
                        .where({'group_fgi.status': 'STAGING'}).toString();
                    app.locals.db.sqlCommand(fullFuncGroupInfoStr, function (err, data) {
                        let hash = {};
                        for (let i = 0; i < data.rows.length; i++) {
                            hash[data.rows[i].id] = data.rows[i];
                        }
                        next(err, hash);
                    });
                },
            }, function (err, results) {
                next(err, results);
            });            
        },
        function (results, next) {
            //organize the data so that it is in JSON the way the policy table wants it
            let functionalGroupObj = {};

            for (let groupId in results.funcGroupHash) {
                const funcGroup = results.funcGroupHash[groupId];
                functionalGroupObj[funcGroup.property_name] = {
                    rpcs: null
                };
                if (funcGroup.user_consent_prompt) {
                    functionalGroupObj[funcGroup.property_name].user_consent_prompt = funcGroup.user_consent_prompt;
                }                
            }

            const rpcPerms = results.rpcPerms;
            const vehiclePerms = results.vehiclePerms;
            //bring all the data together to form a functional groups object meant for the policy table
            //convert all permission IDs to their full form and attach them to the functional group object
            let tasks = [];
            for (let i = 0; i < rpcPerms.length; i++) {
                tasks.push(function (next) {
                    const rpcPerm = rpcPerms[i];
                    const funcPropName = results.funcGroupHash[rpcPerm.function_group_id].property_name;
                    const rpcName = results.rpcNameHash[rpcPerm.rpc_id];
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
                    const funcPropName = results.funcGroupHash[vehiclePerm.function_group_id].property_name;
                    const rpcName = results.rpcNameHash[vehiclePerm.rpc_id];
                    const vehicleDataName = results.vehicleDataNameHash[vehiclePerm.vehicle_id];
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
                //the object is constructed! pass it to a custom policy builder module in case any last-second finishes need to be made
                //this is how HMI_LEVELs can be added, for instance
                next(err, app.locals.builder.modifyFunctionalGroupObject(functionalGroupObj));
            });
        }
    ], function (err, functionalGroupObj) {
        if (err) {
            app.locals.log.error(err);
        }
        //done!
        exportedFunctionalGroupObj = functionalGroupObj;
        callback();
    });

}