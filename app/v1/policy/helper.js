const app = require('../app');
const model = require('./model.js');
const setupSqlCommand = app.locals.sql.setupSqlCommand;

//TODO: remove this
const test = {
    "default": {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": ["Base-4", "RemoteControl"],
        "moduleType": [
            "RADIO",
            "CLIMATE"
        ]
    },
    "9bb1d9c2-5d4c-457f-9d91-86a2f95132df": null,
    "ab9eec11-5fd1-4255-b4cd-769b529c88c4": null,
    "device": {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": ["DataConsent-2"]
    },
    "pre_DataConsent": {
        "keep_context": false,
        "steal_focus": false,
        "priority": "NONE",
        "default_hmi": "NONE",
        "groups": ["BaseBeforeDataConsent"]
    }
}

//TODO: remove this
const makePolicyTable = [
    setupModuleConfig(false),
    setupConsumerFriendlyMessages(false),
    setupFunctionalGroups(false),
    setupAppPolicies(false, test)
];

const policyTableMakeFlow = app.locals.flow(makePolicyTable, {method: 'parallel'});

policyTableMakeFlow(function (err, res) {
    if (err) {
        app.locals.log.error(err);
    }
    /*console.log(res[0]);
    console.log(res[1]);
    console.log(res[2]);
    console.log(res[3]);*/
});

//validation functions

function validateCorePost (req, res) {
    if (!req.body.policy_table) {
        return res.errorMsg = "Please provide policy table information";
    } else if (!req.body.policy_table.app_policies) {
        return res.errorMsg = "Please provide app policies information";
    } else if (!req.body.policy_table.consumer_friendly_messages) {
        return res.errorMsg = "Please provide consumer friendly messages information";
    } else if (!req.body.policy_table.device_data) {
        return res.errorMsg = "Please provide device data information";
    } else if (!req.body.policy_table.functional_groupings) {
        return res.errorMsg = "Please provide functional groupings information";
    } else if (!req.body.policy_table.module_config) {
        return res.errorMsg = "Please provide module config information";
    } else if (!req.body.policy_table.usage_and_error_counts) {
        return res.errorMsg = "Please provide usage and error counts information";
    }
}

function validateAppPolicyOnlyPost (req, res) {
    if (!req.body.policy_table) {
        return res.errorMsg = "Please provide policy table information";
    } else if (!req.body.policy_table.app_policies) {
        return res.errorMsg = "Please provide app policies information";
    }
}


//helper functions

function generatePolicyTable (isProduction, appPolicyObj, returnPreview, cb) {
    let makePolicyTable = [];
    if (returnPreview) {
        makePolicyTable.push(setupModuleConfig(isProduction));
        makePolicyTable.push(setupFunctionalGroups(isProduction));
        makePolicyTable.push(setupConsumerFriendlyMessages(isProduction));
    }
    if (appPolicyObj) { //existence of appPolicyObj implies to return the app policy object
        makePolicyTable.push(setupAppPolicies(isProduction, appPolicyObj));
    }
    const policyTableMakeFlow = app.locals.flow(makePolicyTable, {method: 'parallel'});
    policyTableMakeFlow(cb);
}

function setupModuleConfig (isProduction) {
    const getModuleConfig = [
        setupSqlCommand(app.locals.sql.moduleConfig.info),
        setupSqlCommand(app.locals.sql.moduleConfig.retrySeconds)
    ];
    const moduleConfigGetFlow = app.locals.flow(getModuleConfig, {method: 'parallel'});
    const makeModuleConfig = [
        moduleConfigGetFlow,
        model.moduleConfigSkeleton(isProduction),
        model.constructModuleConfigObj
    ];
    return app.locals.flow(makeModuleConfig, {method: 'waterfall'});    
}

function setupConsumerFriendlyMessages (isProduction) {
    const makeMessages = [
        setupSqlCommand(app.locals.sql.getMessages.status(isProduction)),
        model.messagesSkeleton
    ];
    return app.locals.flow(makeMessages, {method: 'waterfall'});  
}

function setupFunctionalGroups (isProduction) {
    const getFunctionGroupInfo = [
        setupSqlCommand(app.locals.sql.funcGroup.info),
        setupSqlCommand(app.locals.sql.funcGroup.hmiLevels),
        setupSqlCommand(app.locals.sql.funcGroup.parameters)
    ];
    const funcGroupGetFlow = app.locals.flow(getFunctionGroupInfo, {method: 'parallel'});
    const makeFunctionGroupInfo = [
        funcGroupGetFlow,
        model.functionGroupSkeleton,
        model.transformFuncGroupInfo(isProduction),
        model.constructFunctionGroupObj
    ];
    return app.locals.flow(makeFunctionGroupInfo, {method: 'waterfall'});
}

function setupAppPolicies (isProduction, reqAppPolicy) {
    const uuids = Object.keys(reqAppPolicy);
    const getAppPolicy = [
        setupSqlCommand(app.locals.sql.appInfo.base(isProduction, uuids)),
        mapAppBaseInfo(isProduction)
    ];
    const getAppInfoBaseFlow = app.locals.flow(getAppPolicy, {method: 'waterfall'});
    return getAppInfoBaseFlow;
}

function mapAppBaseInfo (isProduction) {
    return function (appObjs, next) {
        const makeFlowArray = appObjs.map(function (appObj) {
            const getAppInfo = [
                setupSqlCommand(app.locals.sql.appInfo.displayNames(appObj.id)),
                setupSqlCommand(app.locals.sql.appInfo.modules(appObj.id)),
                setupSqlCommand(app.locals.sql.appInfo.funcGroups(isProduction, appObj)),
                function (next) {
                    next(null, appObj);
                }
            ];
            const getFlow = app.locals.flow(getAppInfo, {method: 'parallel'});
            const makeFlow = app.locals.flow([getFlow, model.constructAppPolicy], {method: 'waterfall'});
            return makeFlow;
        });

        const parallelMakeFlow = app.locals.flow(makeFlowArray, {method: 'parallel'});
        const finalFlow = app.locals.flow([parallelMakeFlow, model.aggregateResults], {method: 'waterfall'});
        finalFlow(function (err, res) {
            next(err, res);
        });
    }
}

module.exports = {
    validateCorePost: validateCorePost,
    validateAppPolicyOnlyPost: validateAppPolicyOnlyPost,
    generatePolicyTable: generatePolicyTable,
    validateCorePost: validateCorePost,
    validateCorePost: validateCorePost,
}