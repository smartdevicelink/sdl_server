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
//module conf: about 5 ms
//cons msg: about 20 ms
//func groups: about 10 ms
//app pols: about 18 ms
//no app policies: about 30 ms
//SQL method: about 38 ms

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


function post (isProduction) {
	return function (req, res, next) {
		validatePost(req, res);
		if (res.errorMsg) {
			return res.status(400).send({ error: res.errorMsg });
		}

        const makePolicyTable = [
            setupModuleConfig(isProduction),
            setupConsumerFriendlyMessages(isProduction),
            setupFunctionalGroups(isProduction),
            setupAppPolicies(isProduction, test)
        ];
        const policyTableMakeFlow = app.locals.flow(makePolicyTable, {method: 'parallel'});
        policyTableMakeFlow(function (err, res) {
            if (err) {
                app.locals.log.error(err);
                return res.sendStatus(500);
            }
            const policyTable = {
                data: [
                    {  
                        policy_table: {
                            module_config: res[0],
                            functional_groupings: res[1],
                            consumer_friendly_messages: res[2],
                            app_policies: res[3]
                        }
                    }
                ]
            }
            res.status(200).send(policyTable);
        });
	}
}

function validatePost (req, res) {
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
        app.locals.sql.setupSqlCommand(app.locals.sql.messageText),
        messages.messagesSkeleton(isProduction)
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
	postStaging: post(false),
	postProduction: post(true)
};
