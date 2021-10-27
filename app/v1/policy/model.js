const app = require('../app');
const flame = app.locals.flame;
const settings = require('../../../settings.js');
const sqlApp = require('../applications/sql.js');
const _ = require('lodash');
const vehicleDataHelper = require('../vehicle-data/helper.js');
const certController = require('../certificates/controller');
const certUtil = require('../helpers/certificates');

//module config

//keeping this synchronous due to how small the data is. pass this to the event loop
function transformModuleConfig (isProduction, useLongUuids = false, info, next) {
    //expecting only one module config
    const base = info.base[0];
    const retrySeconds = info.retrySeconds.map(function (secondObj) {
        return secondObj.seconds;
    });
    const endpointProperties = info.endpointProperties;

    var concatPort = "";
    var protocol = "http://";
    if(settings.ssl.policyServerPort){
        protocol = "https://";
        if(settings.ssl.policyServerPort != 443){
            concatPort = ":" + settings.ssl.policyServerPort;
        }
    }else if(!settings.ssl.policyServerPort && settings.policyServerPort != 80){
        concatPort = ":" + settings.policyServerPort;
    }

    // asynchronous and synchronous if branches need to be controlled
    let certificateResolution;

    if(certController.openSSLEnabled && base.certificate && base.private_key){
        if (settings.securityOptions.moduleConfigEncryptCertBundle) {
            certificateResolution = certUtil.createKeyCertBundle(base.private_key, base.certificate);
        } else {
            certificateResolution = Promise.resolve(base.certificate + '\n' + base.private_key);
        }
    }
    else {
        certificateResolution = Promise.resolve(undefined);
    }

    certificateResolution.then(result => {
        if (settings.securityOptions.moduleConfigEncryptCertBundle) {
            base.certificate = result.pkcs12.toString('base64');
        } else {
            base.certificate = result;
        }
    }).catch(err => {
        // something went wrong with bundling the cert + key. fallback to default
        console.error(err);
        base.certificate += '\n' + base.private_key;
    }).finally(() => {
        var moduleConfig = {
            "full_app_id_supported": useLongUuids,
            "exchange_after_x_ignition_cycles": base.exchange_after_x_ignition_cycles,
            "exchange_after_x_kilometers": base.exchange_after_x_kilometers,
            "exchange_after_x_days": base.exchange_after_x_days,
            "timeout_after_x_seconds": base.timeout_after_x_seconds,
            "seconds_between_retries": retrySeconds,
            "lock_screen_dismissal_enabled": base.lock_screen_dismissal_enabled,
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
                },
            },
            "endpoint_properties": {
                // to be populated
            },
            "notifications_per_minute_by_priority": {
                "EMERGENCY": base.emergency_notifications,
                "NAVIGATION": base.navigation_notifications,
                "PROJECTION": base.projection_notifications,
                "VOICECOM": base.voicecom_notifications,
                "COMMUNICATION": base.communication_notifications,
                "NORMAL": base.normal_notifications,
                "NONE": base.none_notifications
            },
            "subtle_notifications_per_minute_by_priority": {
                "EMERGENCY": base.subtle_emergency_notifications,
                "NAVIGATION": base.subtle_navigation_notifications,
                "PROJECTION": base.subtle_projection_notifications,
                "VOICECOM": base.subtle_voicecom_notifications,
                "COMMUNICATION": base.subtle_communication_notifications,
                "NORMAL": base.subtle_normal_notifications,
                "NONE": base.subtle_none_notifications
            },
            "certificate": base.certificate,
        };

        // only have custom_vehicle_data_mapping_url present if set by OEM,
        // according to evolution proposal
        if(base.custom_vehicle_data_mapping_url){
            moduleConfig.endpoints.custom_vehicle_data_mapping_url = {
                default: [base.custom_vehicle_data_mapping_url]
            };
        }

        // inject endpoint properties we have from the database
        _.forEach(endpointProperties, function (endProp, index) {
            if (!moduleConfig.endpoint_properties[endProp.endpoint_name] && moduleConfig.endpoints[endProp.endpoint_name]) {
                moduleConfig.endpoint_properties[endProp.endpoint_name] = {};
            }
            if (moduleConfig.endpoint_properties[endProp.endpoint_name] && endProp.property_value) {
                moduleConfig.endpoint_properties[endProp.endpoint_name][endProp.property_name] = endProp.property_value;
            }
        });

        next(null, moduleConfig);
    });
}

//consumer messages

function transformMessages (info, cb) {
    const allMessages = info.messageStatuses;
    const groups = info.messageGroups;
    const highestMessageGroupId = info.highestMessageGroupId[0] ? info.highestMessageGroupId[0].id : 0; // used to help generate a version number
    const versionString = Number(highestMessageGroupId).toLocaleString().replace(/,/g,'.').padStart(11, "000."); // ###.###.### format up to the id of 999,999,999 

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
                    "version": versionString,
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

        groupedData[baseInfo[i].id].encryption_required = baseInfo[i].encryption_required;

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
                groupedData[funcId].rpcs[hmiLevel.permission_name].possible_parameter_count = parseInt(hmiLevel.possible_parameter_count) || 0;
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

                if (data.possible_parameter_count > 0) {
                    //sort the parameters array
                    data.parameters = parameters.sort();
                }
                delete data.possible_parameter_count;
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

function transformRpcVehicleData (rpcTypes = [], rpcParams = [], isForPolicyTable = false, cb) {
    let result = [];
    let typeByName = {};
    let typeById = {};
    let paramsByTypeId = {};
    let vehicleDataParams = [];

    // build dictionaries of types
    for (let type of rpcTypes) {
        typeByName[type.name] = type;
        typeById[type.id] = type;
    }

    // build dictionary of params associated to types
    // and array of vehicle data params
    for (let param of rpcParams) {
        if (!paramsByTypeId[param.rpc_spec_type_id]) {
            paramsByTypeId[param.rpc_spec_type_id] = [];
        }
        paramsByTypeId[param.rpc_spec_type_id].push(param);

        if (
            param.platform != "documentation"
            && _.get(typeById[param.rpc_spec_type_id], "element_type") == "FUNCTION"
            && _.get(typeById[param.rpc_spec_type_id], "name") == "GetVehicleData"
            && _.get(typeById[param.rpc_spec_type_id], "message_type") == "response"
        ) {
            param.key = param.name;
            vehicleDataParams.push(param);
        }
    }

    function paramBuilder (params) {
        let results = [];

        for (let param of params) {
            let vehicleDataItem = vehicleDataHelper.transformVehicleDataItem(param, true);
            vehicleDataItem.params = [];

            let paramType = typeByName[vehicleDataItem.type];
            if (paramType && paramType.element_type == "STRUCT") {
                // recursive struct
                vehicleDataItem.type = "Struct";
                vehicleDataItem.params = paramBuilder(paramsByTypeId[paramType.id]);
            }
            vehicleDataItem.key = vehicleDataItem.name;

            results.push(vehicleDataItem);
        }

        return results;
    }

    result = paramBuilder(vehicleDataParams);

    cb(null, result);
}

function transformVehicleData (isProduction, info, next) {
    let vehicleData = {
        "schema_version": info.schemaVersion[0].version,
        "schema_items": [] // to be populated
    };

    flame.async.parallel({
        "customVehicleData": function(callback){
            vehicleDataHelper.getNestedCustomVehicleData(info.rawCustomVehicleData, true, callback);
        },
        "rpcVehicleData": function(callback){
            // recursively loop through the RPC Spec data to build the nested objects
            transformRpcVehicleData(info.rawRpcSpecTypes, info.rawRpcSpecParams, true, callback);
        }
    }, function(err, transformations){
        if(!err){
            vehicleData.schema_items = _.uniqBy(
                _.concat(transformations.rpcVehicleData, transformations.customVehicleData),
                function(item){
                    return item.name;
                }
            );
        }
        next(err, vehicleData);
    });
}

//application policies

function constructAppPolicy (appObj, useLongUuids = false, res, next) {
    const displayNames = res.displayNames.map(function (elem) {
        return elem.display_text;
    });
    const moduleNames = res.moduleNames.map(function (elem) {
        return elem.permission_name;
    });
    const funcGroupNames = res.funcGroupNames.map(function (elem) {
        return elem.property_name;
    });
    const categories = res.categories.map(function (elem) {
        return elem.name;
    })

    const appServiceObj = {};
    res.serviceTypes.forEach(s => {
        appServiceObj[s.service_type_name] = {
            service_names: [],
            handled_rpcs: [],
        };
    });
    res.serviceTypeNames.forEach(s => {
        appServiceObj[s.service_type_name].service_names.push(s.service_name);
    });

    res.serviceTypePermissions.forEach(s => {
        //only allow the permission if it was selected to be enabled
        if (s.is_selected) {
            appServiceObj[s.service_type_name].handled_rpcs.push({
                function_id: s.function_id
            });
        }
    });
    const appPolicyObj = {};
    const uuidProp = (useLongUuids ? appObj.app_uuid : appObj.app_short_uuid)
    appPolicyObj[uuidProp] = {
        AppHMIType: categories,
        nicknames: displayNames,
        keep_context: true,
        steal_focus: appObj.can_steal_focus,
        priority: "NONE",
        default_hmi: appObj.default_hmi_level.split("_")[1], //trim the HMI_ prefix
        groups: funcGroupNames,
        moduleType: moduleNames,
        RequestType: [],
        RequestSubType: [],
        app_services: appServiceObj,
        allow_unknown_rpc_passthrough: res.appPassthrough.length ? true : false,
        encryption_required : appObj.encryption_required ? true : false
    };

    if (appObj.icon_url) appPolicyObj[uuidProp].icon_url = appObj.icon_url;
    if (appObj.cloud_endpoint) appPolicyObj[uuidProp].endpoint = appObj.cloud_endpoint;
    if (appObj.cloud_transport_type) appPolicyObj[uuidProp].cloud_transport_type = appObj.cloud_transport_type;
    if (appObj.ca_certificate) appPolicyObj[uuidProp].certificate = appObj.ca_certificate;
    if (res.hybridPreference.length) appPolicyObj[uuidProp].hybrid_app_preference = res.hybridPreference[0].hybrid_preference;

    if(res.incomingAppPolicy){
        if (res.incomingAppPolicy.enabled !== undefined) appPolicyObj[uuidProp].enabled = res.incomingAppPolicy.enabled;
        if (res.incomingAppPolicy.auth_token !== undefined) appPolicyObj[uuidProp].auth_token = res.incomingAppPolicy.auth_token;
    }

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
        appPolicy[(res.useLongUuids ? blacklistedApps[i].app_uuid : blacklistedApps[i].app_short_uuid)] = null;
    }

    //setup defaults after the app ids are populated
    appPolicy.default = {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": defaultFuncGroups,
        "RequestType": [],
        "RequestSubType": []
    };
    //DataConsent-2 functional group removed
    appPolicy.device = {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": deviceFuncGroups,
        "RequestType": [],
        "RequestSubType": []
    };
    //BaseBeforeDataConsent functional group removed
    appPolicy.pre_DataConsent = {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": preDataConsentFuncGroups,
        "RequestType": [],
        "RequestSubType": []
    };
    next(null, appPolicy);
}

module.exports = {
    transformModuleConfig: transformModuleConfig,
    transformMessages: transformMessages,
    transformFunctionalGroups: transformFunctionalGroups,
    transformVehicleData: transformVehicleData,
    constructAppPolicy: constructAppPolicy,
    aggregateResults: aggregateResults
}
