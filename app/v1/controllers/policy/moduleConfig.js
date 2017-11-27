const utils = require('./utils');

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

module.exports = {
	moduleConfigSkeleton: moduleConfigSkeleton,
	hashToModuleConfigObj: hashToModuleConfigObj,
	constructModuleConfigObj: constructModuleConfigObj
}