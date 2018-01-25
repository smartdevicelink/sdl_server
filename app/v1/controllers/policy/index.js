const app = require('../../app');
const utils = require('./utils');
const moduleConfig = require('./moduleConfig');
const funcGroup = require('./funcGroup');
const messages = require('./messages');
const appPolicy = require('./appPolicy');

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

function postFromCore (isProduction) {
	return function (req, res, next) {
        validateCorePost(req, res);
		if (res.errorMsg) {
			return res.status(400).send({ error: res.errorMsg });
		}
        generatePolicyTable(isProduction, req.body.policy_table.app_policies, true, function (err, pieces) {
            if (err) {
                app.locals.log.error(err);
                return res.sendStatus(500);
            }
            const policyTable = {
                data: [
                    {  
                        policy_table: {
                            module_config: pieces[0],
                            functional_groupings: pieces[1],
                            consumer_friendly_messages: pieces[2],
                            app_policies: pieces[3]
                        }
                    }
                ]
            }
            res.status(200).send(policyTable); 
        });
	}
}

function getPreview (req, res, next) {
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    generatePolicyTable(isProduction, null, true, function (err, pieces) {
        if (err) {
            app.locals.log.error(err);
            return res.sendStatus(500);
        }
        const policyTable = {
            data: [
                {  
                    policy_table: {
                        module_config: pieces[0],
                        functional_groupings: pieces[1],
                        consumer_friendly_messages: pieces[2]
                    }
                }
            ]
        }
        res.status(200).send(policyTable); 
    });
}

function postAppPolicy (req, res, next) {
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    validateAppPolicyOnlyPost(req, res);
    if (res.errorMsg) {
        return res.status(400).send({ error: res.errorMsg });
    }
    generatePolicyTable(isProduction, req.body.policy_table.app_policies, false, function (err, pieces) {
        if (err) {
            app.locals.log.error(err);
            return res.sendStatus(500);
        }
        const policyTable = {
            data: [
                {  
                    policy_table: {
                        app_policies: pieces[0]
                    }
                }
            ]
        }
        res.status(200).send(policyTable); 
    });
}

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

function setupModuleConfig (isProduction) {
    const getModuleConfig = [
        app.locals.sql.setupSqlCommand(app.locals.sql.moduleConfig.info),
        app.locals.sql.setupSqlCommand(app.locals.sql.moduleConfig.retrySeconds)
    ];
    const moduleConfigGetFlow = app.locals.flow(getModuleConfig, {method: 'parallel'});
    const makeModuleConfig = [
        moduleConfigGetFlow,
        moduleConfig.moduleConfigSkeleton(isProduction),
        moduleConfig.constructModuleConfigObj
    ];
    return app.locals.flow(makeModuleConfig, {method: 'waterfall'});    
}

function setupConsumerFriendlyMessages (isProduction) {
    const makeMessages = [
        app.locals.sql.setupSqlCommand(app.locals.sql.getMessages.status(isProduction)),
        messages.messagesSkeleton
    ];
    return app.locals.flow(makeMessages, {method: 'waterfall'});  
}

function setupFunctionalGroups (isProduction) {
    const getFunctionGroupInfo = [
        app.locals.sql.setupSqlCommand(app.locals.sql.funcGroup.info),
        app.locals.sql.setupSqlCommand(app.locals.sql.funcGroup.hmiLevels),
        app.locals.sql.setupSqlCommand(app.locals.sql.funcGroup.parameters)
    ];
    const funcGroupGetFlow = app.locals.flow(getFunctionGroupInfo, {method: 'parallel'});
    const makeFunctionGroupInfo = [
        funcGroupGetFlow,
        funcGroup.functionGroupSkeleton,
        funcGroup.transformFuncGroupInfo(isProduction),
        funcGroup.constructFunctionGroupObj
    ];
    return app.locals.flow(makeFunctionGroupInfo, {method: 'waterfall'});
}

function setupAppPolicies (isProduction, reqAppPolicy) {
    const uuids = Object.keys(reqAppPolicy);
    const getAppPolicy = [
        app.locals.sql.setupSqlCommand(app.locals.sql.appInfo.base(isProduction, uuids)),
        mapAppBaseInfo(isProduction)
    ];
    const getAppInfoBaseFlow = app.locals.flow(getAppPolicy, {method: 'waterfall'});
    return getAppInfoBaseFlow;
}

function mapAppBaseInfo (isProduction) {
    return function (appObjs, next) {
        const makeFlowArray = appObjs.map(function (appObj) {
            const getAppInfo = [
                app.locals.sql.setupSqlCommand(app.locals.sql.appInfo.displayNames(appObj.id)),
                app.locals.sql.setupSqlCommand(app.locals.sql.appInfo.modules(appObj.id)),
                app.locals.sql.setupSqlCommand(app.locals.sql.appInfo.funcGroups(isProduction, appObj)),
                function (next) {
                    next(null, appObj);
                }
            ];
            const getFlow = app.locals.flow(getAppInfo, {method: 'parallel'});
            const makeFlow = app.locals.flow([getFlow, appPolicy.constructAppPolicy], {method: 'waterfall'});
            return makeFlow;
        });

        const parallelMakeFlow = app.locals.flow(makeFlowArray, {method: 'parallel'});
        const finalFlow = app.locals.flow([parallelMakeFlow, appPolicy.aggregateResults], {method: 'waterfall'});
        finalFlow(function (err, res) {
            next(err, res);
        });
    }
}

module.exports = {
    postFromCoreStaging: postFromCore(false),
    postFromCoreProduction: postFromCore(true),
    getPreview: getPreview,
    postAppPolicy: postAppPolicy
};
