const utils = require('./utils');

function functionGroupSkeleton (groupDataArray, next) {
    const info = groupDataArray[0];
    const hmiLevels = groupDataArray[1];
    const parameters = groupDataArray[2];

    //transform the arrays into hashes with lookups by id for fast referencing
    function transHmiLevels (element) {
        return [
            element['function_group_id'],
            element['permission_name'],
            'hmi_levels',
            element['hmi_level']
        ];
    }
    function transParameters (element) {
        return [
            element['function_group_id'],
            element['rpc_name'],
            'parameters',
            element['parameter']
        ];
    }

    let finalHash = utils.hashify({}, hmiLevels, transHmiLevels, null);
    finalHash = utils.hashify(finalHash, parameters, transParameters, null);
    next(null, info, finalHash);
}

function transformFuncGroupInfo (isProduction) {
    return function (funcGroupInfo, funcGroupHash, next) {
        //pass along the filtered function_group_info results and the transformed func group object
        next(null, utils.filterArrayByStatus(funcGroupInfo, ['property_name'], isProduction), hashToRpcObject(funcGroupHash));
    }
}

//transform the hash into valid functional group rpc objects under the keys
//modifies the original object
function hashToRpcObject (hash) {
    for (let id in hash) {
        const funcGroup = hash[id];
        for (let rpc in funcGroup) {
            //hmi_levels and parameters property needs to be an array
            const data = funcGroup[rpc];
            let hmiLevels = [];
            let parameters = [];
            //manually insert hmi levels. preserve order of BACKGROUND, FULL, LIMITED, NONE
            if (data.hmi_levels.BACKGROUND === null) {
                hmiLevels.push("BACKGROUND");
            }
            if (data.hmi_levels.FULL === null) {
                hmiLevels.push("FULL");
            }
            if (data.hmi_levels.LIMITED === null) {
                hmiLevels.push("LIMITED");
            }
            if (data.hmi_levels.NONE === null) {
                hmiLevels.push("NONE");
            }
            for (let parameter in data.parameters) {
                parameters.push(parameter);
            }
            //erase and replace
            delete data.hmi_levels;
            delete data.parameters;
            if (hmiLevels.length > 0) {
                data.hmi_levels = hmiLevels;
            }
            if (parameters.length > 0) {
                //sort the parameters array
                data.parameters = parameters.sort();
            }
        }
    }
    return hash;
}

function constructFunctionGroupObj (funcGroupInfo, funcGroupSkeleton, next) {
    //remove the IDs and replace them with the property names of the function group for the reverse hash
    let propHash = {};
    for (let i = 0; i < funcGroupInfo.length; i++) {
        propHash[funcGroupInfo[i].id] = funcGroupInfo[i].property_name;
    }

    //combine the two data into the full functional group objects
    //remove the IDs, using funcGroupInfo as the final array of IDs to use
    let functionalGroupings = {};
    for (let i = 0; i < funcGroupInfo.length; i++) {
        const funcInfo = funcGroupInfo[i];
        functionalGroupings[funcInfo.property_name] = {};
        if (funcInfo.user_consent_prompt !== 'null') {
            functionalGroupings[funcInfo.property_name].user_consent_prompt = funcInfo.user_consent_prompt;
        }
        if (funcGroupSkeleton[funcInfo.id]) {
            functionalGroupings[funcInfo.property_name].rpcs = funcGroupSkeleton[funcInfo.id];
        }
        else {
            functionalGroupings[funcInfo.property_name].rpcs = null;
        }
    }

    next(null, functionalGroupings);
}

module.exports = {
    functionGroupSkeleton: functionGroupSkeleton,
	transformFuncGroupInfo: transformFuncGroupInfo,
	hashToRpcObject: hashToRpcObject,
	constructFunctionGroupObj: constructFunctionGroupObj
};