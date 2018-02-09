const app = require('../app');
const utils = require('../policy/utils.js');
const setupSqlCommands = app.locals.sql.setupSqlCommands;
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;

//the function that makes the API response given that all the information is known
function makeFunctionGroups (info, next) {
    const baseInfo = info[0][0];
    const hmiLevels = info[0][1];
    const parameters = info[0][2];
    const consentPrompts = info[0][3];
    let template = info[1];

    function transAggregateRpcs (element) {
        return [
            element['function_group_id'],
            element['permission_name']
        ];
    }
    function transAggregateParameters (element) {
        return [
            element['function_group_id'],
            element['parameter']
        ];
    }

    //get aggregate information such as rpc count and parameter count for each functional group
    let hashRpcs = utils.hashify({}, hmiLevels, transAggregateRpcs, null);
    let hashParameters = utils.hashify({}, parameters, transAggregateParameters, null);
    
    //count up the results.
    for (let id in hashRpcs) {
        hashRpcs[id] = Object.keys(hashRpcs[id]).length;
    }
    for (let id in hashParameters) {
        hashParameters[id] = Object.keys(hashParameters[id]).length;
    }

    //for every base info, clone a template for it and populate it
    let hashedBaseInfo = {};
    for (let i = 0; i < baseInfo.length; i++) {
        hashedBaseInfo[baseInfo[i].id] = JSON.parse(JSON.stringify(template));
        //set properties and things here
        hashedBaseInfo[baseInfo[i].id].id = baseInfo[i].id;
        hashedBaseInfo[baseInfo[i].id].name = baseInfo[i].property_name;
        hashedBaseInfo[baseInfo[i].id].status = baseInfo[i].status;
        hashedBaseInfo[baseInfo[i].id].description = baseInfo[i].description;
        hashedBaseInfo[baseInfo[i].id].user_consent_prompt = baseInfo[i].user_consent_prompt;
        hashedBaseInfo[baseInfo[i].id].is_default = baseInfo[i].is_default;
        hashedBaseInfo[baseInfo[i].id].is_deleted = baseInfo[i].is_deleted;
        hashedBaseInfo[baseInfo[i].id].selected_rpc_count = hashRpcs[baseInfo[i].id];
        hashedBaseInfo[baseInfo[i].id].selected_parameter_count = hashParameters[baseInfo[i].id];
        //if the hash lookup is undefined, use 0
        if (hashedBaseInfo[baseInfo[i].id].selected_rpc_count === undefined) {
            hashedBaseInfo[baseInfo[i].id].selected_rpc_count = 0;
        }
        if (hashedBaseInfo[baseInfo[i].id].selected_parameter_count === undefined) {
            hashedBaseInfo[baseInfo[i].id].selected_parameter_count = 0;
        }

        //get back two things from consent prompts:
        //1. the max ID of the message_category that matches the user_consent_prompt from baseInfo[i]
        //2. the status of that ID (STAGING or PRODUCTION)
        //this is so the UI can determine whether there's an updated version of that message text not in PRODUCTION
        //this only finds the 'en-us' message id 
        hashedBaseInfo[baseInfo[i].id].selected_prompt_id = null;
        hashedBaseInfo[baseInfo[i].id].selected_prompt_status = null;

        const selectedEnglishPrompt = consentPrompts.find(function (prompt) {
            return prompt.message_category === baseInfo[i].user_consent_prompt;
        });
        if (selectedEnglishPrompt) {
            hashedBaseInfo[baseInfo[i].id].selected_prompt_id = selectedEnglishPrompt.id;
            hashedBaseInfo[baseInfo[i].id].selected_prompt_status = selectedEnglishPrompt.status;
        }
    }

    function transFuncGroupInfoRpc (element) {
        return [
            element['function_group_id'],
            'rpcs',
            element['permission_name'],
            'selected'
        ];
    }

    function transFuncGroupInfoHmiLevels (element) {
        return [
            element['function_group_id'],
            'rpcs',
            element['permission_name'],
            'hmi_levels',
            element['hmi_level'],
            'selected'
        ];
    }

    function transFuncGroupInfoParameters (element) {
        return [
            element['function_group_id'],
            'rpcs',
            element['rpc_name'],
            'parameters',
            element['parameter'],
            'selected'
        ];
    }

    //if the template didn't specify rpcs, do not include selected rpc/parameter info in the response
    if (template.rpcs !== undefined) {
        utils.hashify(hashedBaseInfo, hmiLevels, transFuncGroupInfoRpc, true);
        utils.hashify(hashedBaseInfo, hmiLevels, transFuncGroupInfoHmiLevels, true);
        utils.hashify(hashedBaseInfo, parameters, transFuncGroupInfoParameters, true);
    }

    //"unhashify" parts of the object
    //do it to hmi_levels, parameters, rpcs, and the top level. order matters
    utils.arrayify(hashedBaseInfo, [null, 'rpcs', null, 'hmi_levels']);
    utils.arrayify(hashedBaseInfo, [null, 'rpcs', null, 'parameters']);
    utils.arrayify(hashedBaseInfo, [null, 'rpcs']);
    //top level (empty array) is a special case where we must pass in a callback to make some modifications ourselves
    //this is because arrayify cannot replace properties of a parent object because it cannot get that information
    utils.arrayify(hashedBaseInfo, [], function (array) { 
        hashedBaseInfo = array;
    });

    //done!
    //order functional groups since that got messed up here
    next(null, hashedBaseInfo.sort(function (a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    }));
}

function convertFuncGroupJson (obj) {
    //break the JSON down into smaller objects for SQL insertion
    //transform the object so that entries with selected = false are removed
    transformFuncGroupsSelected(obj);

    //function_group_id is dynamically created from this point of view
    //use the property name instead to help find the id later
    const hmiLevels = utils.flattenRecurse(obj['rpcs'], {property_name: obj.name}, function (template, element) {
        template['permission_name'] = element['name'];
        return utils.flattenRecurse(element['hmi_levels'], template, function (template2, element2) {
            template2['hmi_level'] = element2['value'];
            return template2;
        });
    });

    const parameters = utils.flattenRecurse(obj['rpcs'], {property_name: obj.name}, function (template, element) {
        template['rpc_name'] = element['name'];
        return utils.flattenRecurse(element['parameters'], template, function (template2, element2) {
            template2['parameter'] = element2['key'];
            return template2;
        });
    });

    const baseInfo = {
        'property_name': obj.name,
        'user_consent_prompt': obj.user_consent_prompt,
        'description': obj.description,
        'is_default': obj.is_default,
        'is_deleted': obj.is_deleted
    };

    //make base info an array of one object
    return [[baseInfo], hmiLevels, parameters];
}

//given a func group object sent through the UI, remove all elements with selected = false
function transformFuncGroupsSelected (obj) {
    //rpc filter
    obj.rpcs = obj.rpcs.filter(function (e) {
        return e.selected;
    });
    for (let i = 0; i < obj.rpcs.length; i++) {
        const rpc = obj.rpcs[i];
        //hmi level filter
        rpc.hmi_levels = rpc.hmi_levels.filter(function (e) {
            return e.selected;
        });
        //parameter filter
        rpc.parameters = rpc.parameters.filter(function (e) {
            return e.selected;
        });
    }
}

//accepts SQL-like data of function groups, hmi levels, and parameters, along with a status to alter the groups' statuses
//inserts all this information, automatically linking together hmi levels and parameters to their groups
//executes immediately
function insertFuncGroupSql (isProduction, data, next) {
    const groupInfo = data[0];
    const hmiLevels = data[1];
    const parameters = data[2];

    let statusName;
    if (isProduction) {
        statusName = "PRODUCTION";
    }
    else {
        statusName = "STAGING";
    }

    for (let i = 0; i < groupInfo.length; i++) {
        //group status should be changed to whatever the parent function wants
        groupInfo[i].status = statusName;
    }

    //insert message groups
    const insertGroups = app.locals.flow(setupSqlCommands(app.locals.sql.insert.funcGroupInfo(groupInfo)), {method: 'parallel'});
    insertGroups(function (err, res) {
        //flatten the nested arrays to get one array of groups
        const newGroupInfo = res.map(function (elem) {
            return elem[0];
        });        

        //create a link between the old functional group and the new one using the property name
        //use the old functional group to find the matching functional group id of the hmi levels and parameters
        //use the new functional group to replace the hmi levels and parameters ids with the new functional group id
        let newGroupPropertyNameToIdHash = {}; //property name to new id
        for (let i = 0; i < newGroupInfo.length; i++) {
            newGroupPropertyNameToIdHash[newGroupInfo[i].property_name] = newGroupInfo[i].id;
        }
        let oldGroupIdtoIdHash = {}; //old id to property name to new id
        for (let i = 0; i < groupInfo.length; i++) {
            oldGroupIdtoIdHash[groupInfo[i].id] = newGroupPropertyNameToIdHash[groupInfo[i].property_name];
        }        
        //add group id to each hmi level and parameter object
        for (let i = 0; i < hmiLevels.length; i++) {
            hmiLevels[i].function_group_id = oldGroupIdtoIdHash[hmiLevels[i].function_group_id];
        }
        for (let i = 0; i < parameters.length; i++) {
            parameters[i].function_group_id = oldGroupIdtoIdHash[parameters[i].function_group_id];
        }

        //insert hmi levels and parameters
        const insertExtraInfo = app.locals.flow([
            app.locals.flow(setupInsertsSql(app.locals.sql.insert.funcHmiLevels(hmiLevels)), {method: 'parallel'}),
            app.locals.flow(setupInsertsSql(app.locals.sql.insert.funcParameters(parameters)), {method: 'parallel'})
        ], {method: 'parallel'});
        insertExtraInfo(function (err, res) {
            next(); //done
        });        
    });
}

module.exports = {
    makeFunctionGroups: makeFunctionGroups,
    convertFuncGroupJson: convertFuncGroupJson,
    insertFuncGroupSql: insertFuncGroupSql
}