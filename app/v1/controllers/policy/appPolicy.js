const utils = require('./utils');

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
    constructAppPolicy: constructAppPolicy,
    aggregateResults: aggregateResults
};