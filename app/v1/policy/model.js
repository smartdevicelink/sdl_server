const app = require('../app');
const flame = app.locals.flame;
const settings = require('../../../settings.js');
const sqlApp = require('../applications/sql.js');

//module config

//keeping this synchronous due to how small the data is. pass this to the event loop
function transformModuleConfig (isProduction, info, next) {
    //expecting only one module config
    const base = info.base[0];
    const retrySeconds = info.retrySeconds.map(function (secondObj) {
        return secondObj.seconds;
    });

    var concatPort = "";
    var protocol = "http://";
    if(settings.policyServerPortSSL){
        protocol = "https://";
        if(settings.policyServerPortSSL != 443){
            concatPort = ":" + settings.policyServerPortSSL;
        }
    }else if(!settings.policyServerPortSSL && settings.policyServerPort != 80){
        concatPort = ":" + settings.policyServerPort;
    }

    next(null, {
        "preloaded_pt": base.preloaded_pt,
        "exchange_after_x_ignition_cycles": base.exchange_after_x_ignition_cycles,
        "exchange_after_x_kilometers": base.exchange_after_x_kilometers,
        "exchange_after_x_days": base.exchange_after_x_days,
        "timeout_after_x_seconds": base.timeout_after_x_seconds,
        "seconds_between_retries": retrySeconds,
        "endpoints": {
            "0x07": {
                default: [ protocol + settings.policyServerHost + concatPort + "/api/v1/" + (isProduction ? "production" : "staging") + "/policy"]
            },
            "0x04": {
                default: [base.endpoint_0x04]
            },
            "queryAppsUrl": {
                default: [base.query_apps_url]
            },
            "lock_screen_icon_url": {
                default: [base.lock_screen_default_url]
            }
        },
        "notifications_per_minute_by_priority": {
            "EMERGENCY": base.emergency_notifications,
            "NAVIGATION": base.navigation_notifications,
            "VOICECOM": base.voicecom_notifications,
            "COMMUNICATION": base.communication_notifications,
            "NORMAL": base.normal_notifications,
            "NONE": base.none_notifications
        }
    });
}

//consumer messages

function transformMessages (info, cb) {
    const allMessages = info.messageStatuses;
    const groups = info.messageGroups;

    const transformFlow = flame.flow([
        //hash the message groups by message_category
        flame.async.groupBy.bind(null, groups, function (group, callback) {
            callback(null, group.message_category);
        }),
        //filter out messages that don't exist in the hashed message groups
        function (hashedGroups, next) {
            flame.async.filter(allMessages, function (message, callback) {
                callback(null, hashedGroups[message.message_category]);
            }, next);
        },
        //finish constructing the consumer messages object
        function (finalMessages, next) {
            let messageObj = {};
            flame.async.map(finalMessages, function (msg, next) {
                if (!messageObj[msg.message_category]) {
                    messageObj[msg.message_category] = {};
                    messageObj[msg.message_category].languages = {};
                }
                if (!messageObj[msg.message_category].languages[msg.language_id]) {
                    messageObj[msg.message_category].languages[msg.language_id] = {};
                }
                const langObj = messageObj[msg.message_category].languages[msg.language_id];
                langObj.tts = msg.tts ? msg.tts : undefined;
                langObj.line1 = msg.line1 ? msg.line1 : undefined;
                langObj.line2 = msg.line2 ? msg.line2 : undefined;
                langObj.textBody = msg.text_body ? msg.text_body : undefined;
                langObj.label = msg.label ? msg.label : undefined;
                next();
            }, function () {
                next(null, {
                    "version": "000.000.001", //TODO: what to do with the versioning?
                    "messages": messageObj
                });
            });
        }
    ], {method: 'waterfall'});

    transformFlow(cb);
}

//functional groups

function transformFunctionalGroups (isProduction, info, next) {
    const baseInfo = info.base;
    const hmiLevels = info.hmiLevels;
    const parameters = info.parameters;
    const consentPrompts = info.messageGroups;

    //hashes to get hmiLevels and parameters by function group id
    const groupedData = {};
    const hashIdToPropertyName = {};

    //set up the top level objects for these hashes
    for (let i = 0; i < baseInfo.length; i++) {
        groupedData[baseInfo[i].id] = {};

        const selectedPrompt = consentPrompts.find(function (prompt) {
            return prompt.message_category === baseInfo[i].user_consent_prompt;
        });
        //the prompt must exist at least in staging and must be in production mode if isProduction is true
        if (selectedPrompt
            && (!isProduction || selectedPrompt.status === "PRODUCTION")
            && !selectedPrompt.is_deleted) {
            groupedData[baseInfo[i].id].user_consent_prompt = selectedPrompt.message_category;
        }
        groupedData[baseInfo[i].id].rpcs = null;
        hashIdToPropertyName[baseInfo[i].id] = baseInfo[i].property_name;
    }

    //begin asynchronous logic below

    //populate the hash above, using the functional group id as a key
    //include the hmi levels and parameter data
    const groupUpData = flame.flow([
        flame.async.map.bind(null, hmiLevels, function (hmiLevel, next) {
            const funcId = hmiLevel.function_group_id;
            if (!groupedData[funcId].rpcs) {
                groupedData[funcId].rpcs = {};
            }
            if (!groupedData[funcId].rpcs[hmiLevel.permission_name]) {
                groupedData[funcId].rpcs[hmiLevel.permission_name] = {};
                groupedData[funcId].rpcs[hmiLevel.permission_name].hmi_levels = {};
                groupedData[funcId].rpcs[hmiLevel.permission_name].parameters = {};
            }
            groupedData[funcId].rpcs[hmiLevel.permission_name].hmi_levels[hmiLevel.hmi_level] = true;
            next();
        }),
        flame.async.map.bind(null, parameters, function (parameter, next) {
            const funcId = parameter.function_group_id;
            groupedData[funcId].rpcs[parameter.rpc_name].parameters[parameter.parameter] = true;
            next();
        }),
    ], {method: 'series', eventLoop: true});

    //transform groupedData into valid functional group rpc objects under the keys
    //modifies the original object
    function hashToRpcObject (_, next) {
        //asynchronously iterate over groupedData
        flame.async.map(groupedData, function (group, callback) {
            for (let rpc in group.rpcs) {
                //hmi_levels and parameters property needs to be an array
                const data = group.rpcs[rpc];
                let hmiLevels = [];
                let parameters = [];
                //manually insert hmi levels. preserve order of BACKGROUND, FULL, LIMITED, NONE
                if (data.hmi_levels.BACKGROUND) {
                    hmiLevels.push("BACKGROUND");
                }
                if (data.hmi_levels.FULL) {
                    hmiLevels.push("FULL");
                }
                if (data.hmi_levels.LIMITED) {
                    hmiLevels.push("LIMITED");
                }
                if (data.hmi_levels.NONE) {
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
            callback();
        }, next);
    }

    function constructFullObject (_, next) {
        let functionalGroupings = {};
        for (let id in groupedData) {
            const propertyName = hashIdToPropertyName[id];
            functionalGroupings[propertyName] = groupedData[id];
        }
        next(null, functionalGroupings);
    }

    //combine all the steps above
    const constructFunctionalGroupFlow = flame.flow([
        groupUpData,
        hashToRpcObject,
        constructFullObject
    ], {method: 'waterfall', eventLoop: true});

    constructFunctionalGroupFlow(next); //run it
}

//application policies

function constructAppPolicy (appObj, res, next) {
    const displayNames = res.displayNames.map(function (elem) {
        return elem.display_text;
    });
    const moduleNames = res.moduleNames.map(function (elem) {
        return elem.permission_name;
    });
    const funcGroupNames = res.funcGroupNames.map(function (elem) {
        return elem.property_name;
    });

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
    const policyObjs = res.policyObjs;
    const defaultFuncGroups = res.defaultFuncGroups.map(function (obj) {
        return obj.property_name;
    });
    const preDataConsentFuncGroups = res.preDataConsentFuncGroups.map(function (obj) {
        return obj.property_name;
    });
    const deviceFuncGroups = res.deviceFuncGroups.map(function (obj) {
        return obj.property_name;
    });
    const blacklistedApps = res.blacklistedApps;

    const appPolicy = {};

    // set all requested apps to default permissions
    for (let i = 0; i < res.requestedUuids.length; i++) {
        appPolicy[res.requestedUuids[i]] = "default";
    }

    // overwrite available apps with their granted permissions
    for (let i = 0; i < policyObjs.length; i++) {
        const key = Object.keys(policyObjs[i])[0];
        appPolicy[key] = policyObjs[i][key];
    }

    // Set app policy object to null if it is blacklisted
    for (let i = 0; i < blacklistedApps.length; i++) {
        appPolicy[blacklistedApps[i].app_uuid] = null;
    }

    //setup defaults after the app ids are populated
    appPolicy.default = {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": defaultFuncGroups
    };
    //DataConsent-2 functional group removed
    appPolicy.device = {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": deviceFuncGroups
    };
    //BaseBeforeDataConsent functional group removed
    appPolicy.pre_DataConsent = {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": preDataConsentFuncGroups
    };
    next(null, appPolicy);
}

module.exports = {
    transformModuleConfig: transformModuleConfig,
    transformMessages: transformMessages,
    transformFunctionalGroups: transformFunctionalGroups,
    constructAppPolicy: constructAppPolicy,
    aggregateResults: aggregateResults
}
