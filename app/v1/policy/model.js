const utils = require('./utils');
const app = require('../app');
const flame = app.locals.flame;

//module config 

function moduleConfigSkeleton (isProduction) {
    return function (results, next) {
        const moduleConfigs = results[0];
        const moduleConfigRetries = results[1];
        //inject an arbitrary constant in the results to use as a unique property for
        //the filterArrayByStatus algorithm
        for (let i = 0; i < moduleConfigs.length; i++) {
            moduleConfigs[i].CONSTANT = "CONSTANT";
        }
        //transform moduleConfigRetries into hashes with lookups by id
        function transRetries (element) {
            return [
                element['id'],
                'seconds',
                element['seconds']
            ];
        }        
        let finalHash = utils.hashify({}, moduleConfigRetries, transRetries, null);
        next(null, utils.filterArrayByStatus(moduleConfigs, ['CONSTANT'], isProduction), hashToModuleConfigObj(finalHash));
    }
}

//transform the hash into valid module config objects under the keys
//modifies the original object
function hashToModuleConfigObj (hash) {
    for (id in hash) {
        let seconds = [];
        for (value in hash[id].seconds) {
            seconds.push(value - 0); //coerce to numbers
        }
        hash[id].seconds = seconds.sort(function (a, b) {
            return a - b;
        });
    }
    return hash;
}

function constructModuleConfigObj (moduleConfigs, moduleConfigSkeleton, next) {
    let moduleConfig = {};
    //combine the two data into a full module config object
    //remove the IDs, using moduleConfigs as the final array of IDs to use
    //NOTE: there should only ever be one module config passed in, and we only need one module config object
    for (let i = 0; i < moduleConfigs.length; i++) {
        const modConfig = moduleConfigs[i];
        moduleConfig = {
            "preloaded_pt": modConfig.preloaded_pt,
            "exchange_after_x_ignition_cycles": modConfig.exchange_after_x_ignition_cycles,
            "exchange_after_x_kilometers": modConfig.exchange_after_x_kilometers,
            "exchange_after_x_days": modConfig.exchange_after_x_days,
            "timeout_after_x_seconds": modConfig.timeout_after_x_seconds,
            "seconds_between_retries": moduleConfigSkeleton[modConfig.id].seconds,
            "endpoints": {
                "0x07": {
                    default: [modConfig.endpoint_0x07]
                },
                "0x04": {
                    default: [modConfig.endpoint_0x04]
                },
                "queryAppsUrl": {
                    default: [modConfig.query_apps_url]
                },
                "lock_screen_icon_url": {
                    default: [modConfig.lock_screen_default_url]
                }
            },
            "notifications_per_minute_by_priority": {
                "EMERGENCY": modConfig.emergency_notifications,
                "NAVIGATION": modConfig.navigation_notifications,
                "VOICECOM": modConfig.voicecom_notifications,
                "COMMUNICATION": modConfig.communication_notifications,
                "NORMAL": modConfig.normal_notifications,
                "NONE": modConfig.none_notifications
            }
        }
    }
    next(null, moduleConfig);
}

//consumer messages

function messagesSkeleton (results, next) {
    hashifyMessages(results, function (err, finalHash) {
        const finalObj = {
            "version": "000.000.001", //TODO: what to do with the versioning?
            "messages": hashToMessagesObject(finalHash)
        }
        next(null, finalObj);
    });
}

function hashifyMessages (messageInfo, callback) {
    const allMessages = messageInfo.messageStatuses; //for finding how many languages exist per category
    const groups = messageInfo.messageGroups;   

    //hash groups by message_category
    flame.async.groupBy(groups, function (group, callback) {
        callback(null, group.message_category);
    }, function (err, hashedGroups) {
        flame.async.filter(allMessages, function (message, callback) {
            callback(null, hashedGroups[message.message_category]);
        }, function (err, finalMessages) {
            //transform the arrays into hashes, slowly constructing the full object from the pruned finalMessages
            function transGeneric (property) {
                return function (element) {
                    return [
                        element['message_category'],
                        'languages',
                        element['language_id'],
                        property,
                        element[property]
                    ];
                }
            }
            let finalHash = utils.hashify({}, finalMessages, transGeneric('tts'), null);
            finalHash = utils.hashify(finalHash, finalMessages, transGeneric('line1'), null);
            finalHash = utils.hashify(finalHash, finalMessages, transGeneric('line2'), null);
            finalHash = utils.hashify(finalHash, finalMessages, transGeneric('text_body'), null);
            finalHash = utils.hashify(finalHash, finalMessages, transGeneric('label'), null);    
            callback(null, finalHash);
        });
    });
}

//transform the hash into a valid consumer friendly message object under the keys
//modifies the original object
function hashToMessagesObject (hash) {
    for (let category in hash) {
        const languages = hash[category].languages;
        //store values as just strings and not as objects
        for (let language in languages) {
            let langText = languages[language];
            const tts = Object.keys(langText.tts)[0];
            const line1 = Object.keys(langText.line1)[0];
            const line2 = Object.keys(langText.line2)[0];
            const textBody = Object.keys(langText.text_body)[0];
            const label = Object.keys(langText.label)[0];
            //clear langText and replace it
            langText = {};
            if (tts !== "null") {
                langText.tts = tts;
            }
            if (line1 !== "null") {
                langText.line1 = line1;
            }
            if (line2 !== "null") {
                langText.line2 = line2;
            }
            if (textBody !== "null") {
                langText.textBody = textBody;
            }
            if (label !== "null") {
                langText.label = label;
            }
            languages[language] = langText;
        }
    }
    return hash;
}

//functional groups

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
    next(null, info, hashToRpcObject(finalHash));
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

//application policies

function constructAppPolicy (res, next) {
    const displayNames = res[0].map(function (elem) {
        return elem.display_text;
    });
    const moduleNames = res[1].map(function (elem) {
        return elem.permission_name;
    });
    const funcGroupNames = res[2].map(function (elem) {
        return elem.property_name;
    });
    const appObj = res[3];
    
    const appPolicyObj = {};
    appPolicyObj[appObj.app_uuid] = {
        nicknames: displayNames,
        keep_context: true,
        steal_focus: appObj.can_steal_focus,
        priority: "NONE",
        default_hmi: appObj.default_hmi_level.split("_")[1], //trim the HMI_ prefix
        groups: funcGroupNames,
        moduleType: moduleNames
    };

    next(null, appPolicyObj);
}

function aggregateResults (res, next) {
    const appPolicy = {};
    for (let i = 0; i < res.length; i++) {
        const key = Object.keys(res[i])[0];
        appPolicy[key] = res[i][key];
    }
    next(null, appPolicy);
}

/*
//setup defaults
resAppPolicy.default = {
    "keep_context": false,
    "steal_focus": false,
    "priority": "NONE",
    "default_hmi": "NONE",
    "groups": ["Base-4"]               
};
resAppPolicy.device = {
    "keep_context": false,
    "steal_focus": false,
    "priority": "NONE",
    "default_hmi": "NONE",
    "groups": ["DataConsent-2"]              
};
resAppPolicy.pre_DataConsent = {
    "keep_context": false,
    "steal_focus": false,
    "priority": "NONE",
    "default_hmi": "NONE",
    "groups": ["BaseBeforeDataConsent"]              
};
*/

module.exports = {
    moduleConfigSkeleton: moduleConfigSkeleton,
    constructModuleConfigObj: constructModuleConfigObj,
    messagesSkeleton: messagesSkeleton,
    functionGroupSkeleton: functionGroupSkeleton,
    constructFunctionGroupObj: constructFunctionGroupObj,
    constructAppPolicy: constructAppPolicy,
    aggregateResults: aggregateResults
}