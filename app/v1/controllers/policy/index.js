const app = require('../../app');
const utils = require('./utils');
const moduleConfig = require('./moduleConfig');
const funcGroup = require('./funcGroup');
const messages = require('./messages');

constructStaticPolicyTable(true);

function post (isProduction) {
	return function (req, res, next) {
		validatePost(req, res);
		if (res.errorMsg) {
			return res.status(400).send({ error: res.errorMsg });
		}

		//TODO: STUB
		res.status(200).send(policy_table);		
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

//pieces together the module_config, functional_groupings, and consumer_friendly_messages JSON
function constructStaticPolicyTable (isProduction) {
    //FUNCTIONAL GROUPINGS
    const getFunctionGroupInfo = [
        utils.setupSqlCommand(app.locals.sql.funcGroup.info),
        utils.setupSqlCommand(app.locals.sql.funcGroup.hmiLevels),
        utils.setupSqlCommand(app.locals.sql.funcGroup.parameters)
    ];
    const funcGroupGetFlow = app.locals.flow(getFunctionGroupInfo, {method: 'parallel'});
    const makeFunctionGroupInfo = [
        funcGroupGetFlow,
        funcGroup.functionGroupSkeleton(isProduction),
        funcGroup.constructFunctionGroupObj
    ];
    const funcGroupMakeFlow = app.locals.flow(makeFunctionGroupInfo, {method: 'waterfall', pass: 'one'});
    
    //MODULE CONFIG
    const getModuleConfig = [
        utils.setupSqlCommand(app.locals.sql.moduleConfig.info),
        utils.setupSqlCommand(app.locals.sql.moduleConfig.retrySeconds)
    ];
    const moduleConfigGetFlow = app.locals.flow(getModuleConfig, {method: 'parallel'});
    const makeModuleConfig = [
        moduleConfigGetFlow,
        moduleConfig.moduleConfigSkeleton(isProduction),
        moduleConfig.constructModuleConfigObj
    ];
    const moduleConfigMakeFlow = app.locals.flow(makeModuleConfig, {method: 'waterfall', pass: 'one'});
    
    //CONSUMER FRIENDLY MESSAGES
    const makeMessages = [
        utils.setupSqlCommand(app.locals.sql.messageText),
        messages.messagesSkeleton(isProduction)
    ];
    const messagesMakeFlow = app.locals.flow(makeMessages, {method: 'waterfall', pass: 'one'});

    //now combine all flows that make each part of the static table and combine them
    const policyTableMakeFlow = app.locals.flow([moduleConfigMakeFlow, funcGroupMakeFlow, messagesMakeFlow], {method: 'parallel'});
    policyTableMakeFlow(function (err, res) {
        if (err) {
            return app.locals.log.error(err);
        }
        console.log(res[0]);
        console.log(res[1]);
        console.log(res[2]);
    });
}

module.exports = {
	postStaging: post(false),
	postProduction: post(true)
};
