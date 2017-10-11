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

//takes in data from the DB and converts it into functional groups that can be assigned to apps
function createFunctionalGroupObject (callback) {
    async.waterfall([
        function (next) {
            //get all of the functional group permission data
            const functionPermissionsStr = sql.select('*').from('function_group_permissions').toString();
            const permissionRelationsStr = sql.select('*').from('permission_relations').toString();
            const permissionNamesStr = sql.select('*').from('permissions').toString();
            async.parallel({
                functionPerms: function (next) {
                    app.locals.db.sqlCommand(functionPermissionsStr, function (err, data) {
                        next(err, data.rows);
                    });                   
                },
                //hash the ids of functional group info and other info for easy and fast lookup to their properties
                permissionRelationsHash: function (next) {
                    app.locals.db.sqlCommand(permissionRelationsStr, function (err, data) {
                        //hash the child permissions so that the values are an array of parent permissions
                        //this will be useful later
                        let hash = {};
                        for (let i = 0; i < data.rows.length; i++) {
                            if (!hash[data.rows[i].child_permission_name]) {
                                hash[data.rows[i].child_permission_name] = [];
                            }
                            hash[data.rows[i].child_permission_name].push(data.rows[i].parent_permission_name);
                        }
                        next(err, hash);
                    });                    
                },
                permissionNamesHash: function (next) {
                    app.locals.db.sqlCommand(permissionNamesStr, function (err, data) {
                        let hash = {};
                        for (let i = 0; i < data.rows.length; i++) {
                            hash[data.rows[i].name] = data.rows[i].type;
                        }
                        next(err, hash);
                    });                    
                },
                funcGroupHash: function (next) {
                    //get all the function group infos' property names with the highest id
                    const groupedFuncGroupInfoStr = sql.select('property_name', 'status', 'is_default', 'max(id) AS id')
                        .from('function_group_info')
                        .groupBy('property_name', 'status', 'is_default').toString();

                    //TODO: be able to specify STAGING or PRODUCTION when we add the routing for this
                    const fullFuncGroupInfoStr = sql.select('function_group_info.*')
                        .from('(' + groupedFuncGroupInfoStr + ') group_fgi')
                        .join('function_group_info', {'function_group_info.id': 'group_fgi.id'})
                        .where({'group_fgi.status': 'PRODUCTION'}).toString();
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
            //organize the data so that it is in JSON the way the policy table expects it
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

            const functionPerms = results.functionPerms;
            //bring all the data together to form a functional groups object meant for the policy table
            //attach all permissions to the functional group object
            let tasks = [];
            for (let i = 0; i < functionPerms.length; i++) {
                tasks.push(function (next) {
                    const functionPerm = functionPerms[i];
                    const permName = functionPerm.permission_name;
                    const funcPropName = results.funcGroupHash[functionPerm.function_group_id].property_name;
                    if (functionalGroupObj[funcPropName].rpcs === null) { //null check
                        functionalGroupObj[funcPropName].rpcs = {};
                    }
                    //check the type of permission we are dealing with here. different types mean different actions are required
                    //RPC type: create a property in the associated function group using the rpc name
                    //PARAMETER type: add the property to a parameters array in all objects with the parent names of that property
                    //MODULE type: the module type permission exists, but it is never defined in any functional group objects.
                    //  they are only specified in regards to app permissions and stored in the app policy object
                    if (results.permissionNamesHash[permName] === "RPC") {
                        functionalGroupObj[funcPropName].rpcs[permName] = {}; //leave empty 
                    }
                    else if (results.permissionNamesHash[permName] === "PARAMETER") {
                        //include this parameter in all RPC parents of this functional group
                        const parents = results.permissionRelationsHash[permName];
                        for (let j = 0; j < parents.length; j++) {
                            const parentRpc = parents[j];
                            //null checks
                            if (functionalGroupObj[funcPropName].rpcs[parentRpc] === undefined) {
                                functionalGroupObj[funcPropName].rpcs[parentRpc] = {};
                                functionalGroupObj[funcPropName].rpcs[parentRpc].parameters = [];
                            }
                            if (functionalGroupObj[funcPropName].rpcs[parentRpc].parameters === undefined) {
                                functionalGroupObj[funcPropName].rpcs[parentRpc].parameters = [];
                            }
                            functionalGroupObj[funcPropName].rpcs[parentRpc].parameters.push(permName);                              
                        }
                    }

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