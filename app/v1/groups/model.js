const app = require('../app');
const sql = require('./sql.js');
const sqlBrick = require('sql-bricks-postgres');
const async = require('async');

//generates a single-element functional group info template object
async function generateTemplate (info) {
    //get what the full response would look like in hash form
    let rpcHash = generateRpcObjectHash(info.rpcs, info.permissionRelations, info.hmiValues);

    //convert the hash into an array
    const rpcs = rpcHashToArray(rpcHash);
    let template = baseTemplate();
    template.rpcs = rpcs;
    return template;
}

async function generateRpcHash (isProduction = false) {
    const info = {
        rpcs: app.locals.db.asyncSql(sql.rpcs),
        permissionRelations: app.locals.db.asyncSql(sql.permissionRelationsNoModules(isProduction)),
        hmiValues: app.locals.db.asyncSql(sql.hmiLevels),
    };

    for (let prop in info) {
        info[prop] = await info[prop]; // resolve all promises into each property
    }

    return generateRpcObjectHash(info.rpcs, info.permissionRelations, info.hmiValues);
}

//only needs to be generated once, because the RPC list and permission relations cannot be changed after server start up
//used as a step in generating a functional group response
//an exception is made for this being synchronous due to the conditions in which this runs
function generateRpcObjectHash (rpcs, permissionRelations, hmiValues) {
    let rpcHash = {}; //build the cache

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
        rpcHash[rpcName] = {};
        rpcHash[rpcName].name = rpcName;
        rpcHash[rpcName].hmi_levels = hmiValuesHash;
        rpcHash[rpcName].selected = false;
        rpcHash[rpcName].parameters = {};
    }

    for (let i = 0; i < permissionRelations.length; i++) {
        const rpcName = permissionRelations[i].parent_permission_name;
        const parameterName = permissionRelations[i].child_permission_name;
        const isCustom = permissionRelations[i].is_custom;
        rpcHash[rpcName].parameters[parameterName] = {
            name: parameterName,
            key: parameterName,
            is_custom: isCustom,
            selected: false
        };
    }

    return rpcHash;
}

//convert the rpc hash into an array suitable for responding to the UI
function rpcHashToArray (rpcHash) {
    let rpcs = [];
    for (let prop in rpcHash) {
        rpcs.push(handleRpc(rpcHash[prop]));
    }
    //sort the rpcs by name
    rpcs.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (b.name < a.name) return 1;
        return 0;
    });

    return rpcs;

    function handleRpc (rpc) {
        //make the hmi levels an array
        const hmiLevelArray = [];
        for (let hmiLevel in rpc.hmi_levels) {
            hmiLevelArray.push(rpc.hmi_levels[hmiLevel]);
        }
        rpc.hmi_levels = hmiLevelArray;
        //sort the parameters by name, making it an array in the process
        //put all custom vehicle data at the bottom. use is_custom property which will equal true for custom data
        //this forces all custom data to be later in the sort than non-custom data ('false' comes before 'true')
        let parameters = [];
        for (let prop in rpc.parameters) {
            parameters.push(rpc.parameters[prop]);
        }

        parameters.sort((a, b) => {
            if (a.is_custom + a.name < b.is_custom + b.name) return -1;
            if (b.is_custom + b.name < a.is_custom + a.name) return 1;
            return 0;
        });

        rpc.parameters = parameters;
        return rpc;
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
        is_app_provider_group: false,
        is_administrator_group: false,
        encryption_required: false,
        is_widget_group: false,
        is_proprietary_group: false,
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
        obj.is_app_provider_group = objOverride.is_app_provider_group;
        obj.is_administrator_group = objOverride.is_administrator_group;
        obj.encryption_required = objOverride.encryption_required;
        obj.is_widget_group = objOverride.is_widget_group;
        obj.is_proprietary_group = objOverride.is_proprietary_group;
        obj.is_deleted = objOverride.is_deleted;
    }

    return obj;
}

//creates functional groups in a format the UI can understand
async function makeFunctionGroups (includeRpcs, isProduction, info) {
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
    hmiLevels.map(hmiLevel => {
        const funcId = hmiLevel.function_group_id;
        groupedData[funcId].hmiLevels.push(hmiLevel);
        groupedRpcCount[funcId][hmiLevel.permission_name] = true;
    });
    parameters.map(parameter => {
        const funcId = parameter.function_group_id;
        groupedData[funcId].parameters.push(parameter);
        groupedParameterCount[funcId][parameter.parameter] = true;
    });

    //count up the rpc results
    for (let id in groupedRpcCount) {
        groupedRpcCount[id] = Object.keys(groupedRpcCount[id]).length;
    }
    //count up the parameter results
    for (let id in groupedParameterCount) {
        groupedParameterCount[id] = Object.keys(groupedParameterCount[id]).length;
    }

    //functional group top level object creation
    const functionalGroups = baseInfo.map(baseElement => {
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
        return funcGroup;
    });

    //rpc array creation
    //if the template didn't specify rpcs, do not include selected rpc/parameter info in the response
    if (includeRpcs) {
        //create RPC arrays for each functional group id and attach it to the functional group
        const rpcHashTemplate = await generateRpcHash(isProduction);
        functionalGroups.forEach(group => {
            const funcGroupData = groupedData[group.id];
            const rpcHash = populateRpcHash(
                JSON.parse(JSON.stringify(rpcHashTemplate)),
                funcGroupData.hmiLevels,
                funcGroupData.parameters
            );
            const rpcs = rpcHashToArray(rpcHash);

            group.rpcs = rpcs; //attach the rpc array
        });               
    }

    //order the functional groups by name
    functionalGroups.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (b.name < a.name) return 1;
        return 0;
    });

    return functionalGroups;
}

//uses an rpc hash and converts the selected values to true based on hmi level and parameter data that exists
function populateRpcHash (rpcHash, hmiLevels, parameters) {
    //iterate through hmi levels and parameters (if they exist) and make the selections true
    for (let i = 0; i < hmiLevels.length; i++) {
        const rpcName = hmiLevels[i].permission_name;
        const level = hmiLevels[i].hmi_level;
        // set the selected rpcs to true, including at the RPC level
        // only do this for RPCs that have been synced from SHAID
        if(rpcHash[rpcName]){
            rpcHash[rpcName].selected = true;
            rpcHash[rpcName].hmi_levels[level].selected = true;
        }
    }
    for (let i = 0; i < parameters.length; i++) {
        const rpcName = parameters[i].rpc_name;
        const parameter = parameters[i].parameter;

        // custom vehicle data not guaranteed to be promoted to PRODUCTION before the functional group
        if(rpcHash[rpcName].parameters[parameter]){
            //set the selected rpcs to true
            rpcHash[rpcName].parameters[parameter].selected = true;
        }
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
        is_app_provider_group: functionalGroupObj.is_app_provider_group || false,
        is_administrator_group: functionalGroupObj.is_administrator_group || false,
        encryption_required : functionalGroupObj.encryption_required || false,
        is_widget_group: functionalGroupObj.is_widget_group || false,
        is_proprietary_group: functionalGroupObj.is_proprietary_group || false,
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

async function insertFunctionalGroupsWithTransaction (isProduction, rawFunctionalGroups) {
    let wf = {},
        status = isProduction ? "PRODUCTION" : "STAGING";

    await app.locals.db.asyncTransaction(async client => {
        // process groups synchronously (due to the SQL transaction)
        for (let rawFunctionalGroup of rawFunctionalGroups) {
            // clean the functional group object for insertion and insert it into the db
            let insertableObject = convertToInsertableFunctionalGroupInfo(rawFunctionalGroup, status);
            let insertedGroup = await client.getOne(sqlBrick.insert('function_group_info', insertableObject).returning('*').toString());
            // filter out any unselected rpc
            const rawSelectedRpcs = rawFunctionalGroup.rpcs.filter(obj => isProduction || obj.selected);

            // process each selected RPC
            for (let rawSelectedRpc of rawSelectedRpcs) {
                // clean and insert RPC HMI Levels
                for (let rawHmi of rawSelectedRpc.hmi_levels) {
                    // skip unselected HMIs
                    if (!rawHmi.selected) {
                        continue;
                    }
                    // clean and insert HMI record
                    let insertableHmi = convertToInsertableHMI(rawHmi, insertedGroup.id, rawSelectedRpc.name);
                    await client.getOne(sqlBrick.insert('function_group_hmi_levels', insertableHmi).returning('*').toString());
                }
                // clean and insert permissions/parameters
                for (let rawPermission of rawSelectedRpc.parameters) {
                    // skip unselected permissions
                    if (!rawPermission.selected) {
                        continue;
                    }
                    // clean and insert permission record
                    let insertablePermission = convertToInsertablePermission(rawPermission, insertedGroup.id, rawSelectedRpc.name);
                    await client.getOne(sqlBrick.insert('function_group_parameters', insertablePermission).returning('*').toString());
                }
            }
        }
    });
}

module.exports = {
    makeFunctionGroups: makeFunctionGroups,
    generateTemplate: generateTemplate,
    insertFunctionalGroupsWithTransaction: insertFunctionalGroupsWithTransaction,
    rpcHashToArray: rpcHashToArray,
    generateRpcObjectHash: generateRpcObjectHash
}
