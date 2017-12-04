const utils = require('../policy/utils.js');

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
    next(null, hashedBaseInfo);
}

//modifies the original reference. sends the template back in an array
function arrayifyOneFuncGroup (template, next) {
    utils.arrayify(template, ['rpcs', null, 'hmi_levels']);
    utils.arrayify(template, ['rpcs', null, 'parameters']);
    utils.arrayify(template, ['rpcs']);
    next(null, [template]);
}

//generates a template response that can be used to describe any specific function group info
function generateTemplate (info, next) {
    const rpcs = info[0];
    const permissionRelations = info[1];
    const hmiLevels = info[2];

    let hmiLevelsHash = {};
    for (let i = 0; i < hmiLevels.length; i++) {
        hmiLevelsHash[hmiLevels[i].id] = {
            name: hmiLevels[i].id,
            value: hmiLevels[i].id,
            selected: false
        }
    }

    function transRelations (element) {
        return [
            element['parent_permission_name'],
            element['child_permission_name']
        ];
    }

    let template = baseTemplate();
    template.rpcs = {};

    const parameterRelations = hashedRelationsTransform(utils.hashify({}, permissionRelations, transRelations, null));

    for (let i = 0; i < rpcs.length; i++) {
        const rpc = rpcs[i];
        let obj = {
            name: rpc.name,
            hmi_levels: hmiLevelsHash,
            selected: false
        };
        if (parameterRelations[rpc.name]) {
            //the permission exists in the parent permissions
            obj.parameters = parameterRelations[rpc.name]
        }
        template.rpcs[rpc.name] = obj;      
    }

    //it's just as fast, if not faster, to setup the template, not worrying about storing references
    //in multiple places, and blasting them all out with parse/stringify. it's also safer.
    next(null, JSON.parse(JSON.stringify(template)));
}

function baseTemplate () {
    return {
        id: 0,
        name: "",
        description: "",
        status: "",
        selected_prompt_id: 0,
        selected_rpc_count: 0,
        selected_parameter_count: 0,
        is_default: false,
        user_consent_prompt: null
    };
}

function hashedRelationsTransform (relations) {
    let response = {};
    for (rpc in relations) {
        response[rpc] = {};
        for (parameter in relations[rpc]) {
            response[rpc][parameter] = {
                name: parameter,
                key: parameter,
                selected: false
            };
        }
    }
    return response;
}

function convertFuncGroupJson (obj, isProduction) {
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
        'is_default': obj.is_default
    };
    if (isProduction) {
        baseInfo.status = 'PRODUCTION';
    }
    else {
        baseInfo.status = 'STAGING';
    }

    return [baseInfo, hmiLevels, parameters];
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

module.exports = {
    generateTemplate: generateTemplate,
    baseTemplate: baseTemplate,
    makeFunctionGroups: makeFunctionGroups,
    convertFuncGroupJson: convertFuncGroupJson,
    arrayifyOneFuncGroup: arrayifyOneFuncGroup
};