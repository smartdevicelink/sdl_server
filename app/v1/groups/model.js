const app = require('../app');
const flame = app.locals.flame;
const flow = app.locals.flow;
const setupSqlCommands = app.locals.db.setupSqlCommands;
const sql = require('./sql.js');
const sqlBrick = require('sql-bricks-postgres');
const async = require('async');

let cachedTemplate;
let cachedRpcHash;

function getFunctionGroupTemplate () {
    //the cached object is expected to be mutated, so return a full copy!
    return JSON.parse(JSON.stringify(cachedTemplate));
}

function getRpcHashTemplate () {
    //the cached object is expected to be mutated, so return a full copy!
    return JSON.parse(JSON.stringify(cachedRpcHash));
}

//generates a single-element functional group info template object
function generateTemplate (info, next) {
    //get what the full response would look like in hash form
    generateRpcObjectHash(info.rpcs, info.permissionRelations, info.hmiValues);

    //convert the hash into an array
    rpcHashToArray(getRpcHashTemplate(), function (err, rpcs) {
        cachedTemplate = baseTemplate();
        cachedTemplate.rpcs = rpcs;
        next();
    });
}

//only needs to be generated once, because the RPC list and permission relations cannot be changed after server start up
//used as a step in generating a functional group response
//an exception is made for this being synchronous due to the conditions in which this runs
function generateRpcObjectHash (rpcs, permissionRelations, hmiValues) {
    cachedRpcHash = {}; //build the cache

    const hmiValuesHash = {};
    for (let i = 0; i < hmiValues.length; i++) {
        const value = hmiValues[i].id;
        hmiValuesHash[value] = {
            name: value,
            value: value,
            selected: false
        };
    }

    for (let i = 0; i < rpcs.length; i++) {
        const rpcName = rpcs[i].name;
        cachedRpcHash[rpcName] = {};
        cachedRpcHash[rpcName].name = rpcName;
        cachedRpcHash[rpcName].hmi_levels = hmiValuesHash;
        cachedRpcHash[rpcName].selected = false;
        cachedRpcHash[rpcName].parameters = {};
    }

    for (let i = 0; i < permissionRelations.length; i++) {
        const rpcName = permissionRelations[i].parent_permission_name;
        const parameterName = permissionRelations[i].child_permission_name;
        cachedRpcHash[rpcName].parameters[parameterName] = {
            name: parameterName,
            key: parameterName,
            selected: false
        };
    }
}

//convert the rpc hash into an array suitable for responding to the UI
function rpcHashToArray (rpcHash, next) {
    //asynchronously iterate over the hash
    flame.async.map(rpcHash, handleRpc, function (err, rpcs) {
        //sort the rpcs by name
        flame.async.sortBy(rpcs, function (rpc, callback) {
            callback(null, rpc.name);
        }, next);
    });

    function handleRpc (rpc, callback) {
        //make the hmi levels an array
        const hmiLevelArray = [];
        for (let hmiLevel in rpc.hmi_levels) {
            hmiLevelArray.push(rpc.hmi_levels[hmiLevel]);
        }
        rpc.hmi_levels = hmiLevelArray;
        //sort the parameters by name, making it an array in the process
        flame.async.sortBy(rpc.parameters, function (parameter, callback) {
            callback(null, parameter.name);
        }, function (err, sortedParameters) {
            rpc.parameters = sortedParameters;
            callback(null, rpc);
        });
    }
}

function baseTemplate (objOverride) {
    const obj = {
        id: 0,
        name: "",
        description: "",
        status: "",
        selected_prompt_id: null,
        selected_prompt_status: null,
        selected_rpc_count: 0,
        selected_parameter_count: 0,
        is_default: false,
        is_pre_data_consent: false,
        is_device: false,
        is_deleted: false,
        user_consent_prompt: null,
        rpcs: []
    };

    if (objOverride) {
        //add overrides to the default
        obj.id = objOverride.id;
        obj.name = objOverride.property_name;
        obj.status = objOverride.status;
        obj.description = objOverride.description;
        obj.user_consent_prompt = objOverride.user_consent_prompt;
        obj.is_default = objOverride.is_default;
        obj.is_pre_data_consent = objOverride.is_pre_data_consent;
        obj.is_device = objOverride.is_device;
        obj.is_deleted = objOverride.is_deleted;
    }

    return obj;
}

//creates functional groups in a format the UI can understand
function makeFunctionGroups (includeRpcs, info, next) {
    const baseInfo = info.base;
    const hmiLevels = info.hmiLevels;
    const parameters = info.parameters;
    const consentPrompts = info.messageGroups;

    //hashes to get hmiLevels and parameters by function group id
    const groupedData = {};
    //hashes to get the rpc count and parameter count of each functional group
    const groupedRpcCount = {};
    const groupedParameterCount = {};

    //set up the top level objects for these hashes
    for (let i = 0; i < baseInfo.length; i++) {
        groupedData[baseInfo[i].id] = {};
        groupedData[baseInfo[i].id].hmiLevels = [];
        groupedData[baseInfo[i].id].parameters = [];
        groupedRpcCount[baseInfo[i].id] = {};
        groupedParameterCount[baseInfo[i].id] = {};
    }

    //begin asynchronous logic below

    //populate the hashes above, using the functional group id as a key
    const groupUpData = flow([
        flame.async.map.bind(null, hmiLevels, function (hmiLevel, next) {
            const funcId = hmiLevel.function_group_id;
            groupedData[funcId].hmiLevels.push(hmiLevel);
            groupedRpcCount[funcId][hmiLevel.permission_name] = true;
            next();
        }),
        flame.async.map.bind(null, parameters, function (parameter, next) {
            const funcId = parameter.function_group_id;
            groupedData[funcId].parameters.push(parameter);
            groupedParameterCount[funcId][parameter.parameter] = true;
            next();
        }),
        function (next) {
            //count up the rpc results
            for (let id in groupedRpcCount) {
                groupedRpcCount[id] = Object.keys(groupedRpcCount[id]).length;
            }
            //count up the parameter results
            for (let id in groupedParameterCount) {
                groupedParameterCount[id] = Object.keys(groupedParameterCount[id]).length;
            }
            next();
        }
    ], {method: 'series', eventLoop: true});

    //functional group top level object creation
    const createFunctionalGroupBaseFlow = flow(flame.map(baseInfo, function (baseElement, next) {
        const funcGroup = baseTemplate(baseElement); //add defaults
        if (groupedRpcCount[baseElement.id] !== undefined) {
            funcGroup.selected_rpc_count = groupedRpcCount[baseElement.id];
        }
        if (groupedParameterCount[baseElement.id] !== undefined) {
            funcGroup.selected_parameter_count = groupedParameterCount[baseElement.id];
        }
        //get back two things from consent prompts:
        //1. the max ID of the message_category that matches the user_consent_prompt from funcGroup
        //2. the status of that ID (STAGING or PRODUCTION)
        //this is so the UI can determine whether there's an updated version of that message text not in PRODUCTION
        //this only finds the 'en-us' message id for now
        const selectedEnglishPrompt = consentPrompts.find(function (prompt) {
            return prompt.message_category === funcGroup.user_consent_prompt;
        });
        if (selectedEnglishPrompt && !selectedEnglishPrompt.is_deleted) {
            funcGroup.selected_prompt_id = selectedEnglishPrompt.id;
            funcGroup.selected_prompt_status = selectedEnglishPrompt.status;
        }
        else {
            funcGroup.user_consent_prompt = null;
        }
        next(null, funcGroup);
    }), {method: 'parallel', eventLoop: true});

    //rpc array creation
    function rpcInsertion (functionalGroups, next) {
        //if the template didn't specify rpcs, do not include selected rpc/parameter info in the response
        if (includeRpcs) {
            //create RPC arrays for each functional group id and attach it to the functional group
            flame.async.map(functionalGroups, function (group, callback) {
                const funcGroupData = groupedData[group.id];
                const rpcHash = populateRpcHash(getRpcHashTemplate(), funcGroupData.hmiLevels, funcGroupData.parameters);
                rpcHashToArray(rpcHash, function (err, rpcs) {
                    group.rpcs = rpcs; //attach the rpc array
                    callback(null, group);
                });
            }, next);
        }
        else {
            next(null, functionalGroups); //skip rpc insertion
        }
    }

    //order the functional groups by name
    function asyncSortFunctionalGroups (functionalGroups, next) {
        flame.async.sortBy(functionalGroups, function (funcGroup, callback) {
            callback(null, funcGroup.name);
        }, next);
    }

    //combine all the steps above
    const constructFunctionalGroupFlow = flow([
        groupUpData,
        createFunctionalGroupBaseFlow,
        rpcInsertion,
        asyncSortFunctionalGroups
    ], {method: 'waterfall', eventLoop: true});

    constructFunctionalGroupFlow(next); //run it
}

//uses an rpc hash and converts the selected values to true based on hmi level and parameter data that exists
function populateRpcHash (rpcHash, hmiLevels, parameters) {
    //iterate through hmi levels and parameters (if they exist) and make the selections true
    for (let i = 0; i < hmiLevels.length; i++) {
        const rpcName = hmiLevels[i].permission_name;
        const level = hmiLevels[i].hmi_level;
        //set the selected rpcs to true, including at the RPC level
        rpcHash[rpcName].selected = true;
        rpcHash[rpcName].hmi_levels[level].selected = true;
    }
    for (let i = 0; i < parameters.length; i++) {
        const rpcName = parameters[i].rpc_name;
        const parameter = parameters[i].parameter;
        //set the selected rpcs to true
        rpcHash[rpcName].parameters[parameter].selected = true;
    }
    return rpcHash;
}

function convertToInsertableFunctionalGroupInfo (functionalGroupObj, statusOverride = null) {
    return {
        property_name: functionalGroupObj.name || null,
        user_consent_prompt: functionalGroupObj.user_consent_prompt || null,
        status: statusOverride || functionalGroupObj.status || null,
        is_default: functionalGroupObj.is_default || false,
        is_pre_data_consent: functionalGroupObj.is_pre_data_consent || false,
        is_device: functionalGroupObj.is_device || false,
        description: functionalGroupObj.description || null,
        is_deleted: functionalGroupObj.is_deleted || false
    };
}

function convertToInsertableHMI (hmiObj, functionalGroupId, permissionName) {
    return {
        function_group_id: functionalGroupId || null,
        permission_name: permissionName,
        hmi_level: hmiObj.value
    };
}

function convertToInsertablePermission (permissionObj, functionalGroupId, rpcName) {
    return {
        function_group_id: functionalGroupId || null,
        parameter: permissionObj.key || null,
        rpc_name: rpcName || null
    };
}

function insertFunctionalGroupsWithTransaction(isProduction, rawFunctionalGroups, callback){
    let wf = {},
        status = isProduction ? "PRODUCTION" : "STAGING";

    app.locals.db.runAsTransaction(function (client, callback) {
        // process groups synchronously (due to the SQL transaction)
        async.eachSeries(rawFunctionalGroups, function (rawFunctionalGroup, callback) {
            let insertedGroup = null;
            async.waterfall([
                function (callback) {
                    // clean the functional group object for insertion and insert it into the db
                    let insertableObject = convertToInsertableFunctionalGroupInfo(rawFunctionalGroup, status);
                    let insert = sqlBrick.insert('function_group_info', insertableObject).returning('*');
                    client.getOne(insert.toString(), callback);
                },
                function (group, callback) {
                    insertedGroup = group;
                    // filter out any unselected rpc
                    async.filter(rawFunctionalGroup.rpcs, function (obj, callback) {
                        callback(null, (isProduction || obj.selected));
                    }, callback);
                },
                function (rawSelectedRPCs, callback) {
                    // process each selected RPC
                    async.eachSeries(rawSelectedRPCs, function (rawSelectedRPC, callback) {
                        async.waterfall([
                            function (callback) {
                                // clean and insert RPC HMI Levels
                                async.eachSeries(rawSelectedRPC.hmi_levels, function (rawHMI, callback) {
                                    // skip unselected HMIs
                                    if(!(rawHMI.selected)){
                                        callback(null);
                                        return;
                                    }
                                    // clean and insert HMI record
                                    let insertableHMI = convertToInsertableHMI(rawHMI, insertedGroup.id, rawSelectedRPC.name);
                                    let insert = sqlBrick.insert('function_group_hmi_levels', insertableHMI).returning('*');
                                    client.getOne(insert.toString(), callback);
                                }, callback);
                            },
                            function (callback) {
                                // clean and insert permissions/parameters
                                async.eachSeries(rawSelectedRPC.parameters, function (rawPermission, callback) {
                                    // skip unselected permissions
                                    if(!(rawPermission.selected)){
                                        callback(null);
                                        return;
                                    }
                                    // clean and insert permission record
                                    let insertablePermission = convertToInsertablePermission(rawPermission, insertedGroup.id, rawSelectedRPC.name);
                                    let insert = sqlBrick.insert('function_group_parameters', insertablePermission).returning('*');
                                    client.getOne(insert.toString(), callback);
                                }, callback);
                            }
                        ], callback);
                    }, callback);
                }
            ], callback);
        }, callback);
    }, function (err,result) {
        // done either successfully or post-rollback
        callback(err);
    });
}

module.exports = {
    makeFunctionGroups: makeFunctionGroups,
    generateTemplate: generateTemplate,
    getFunctionGroupTemplate: getFunctionGroupTemplate,
    getRpcHashTemplate: getRpcHashTemplate,
    insertFunctionalGroupsWithTransaction: insertFunctionalGroupsWithTransaction,
    rpcHashToArray: rpcHashToArray
}