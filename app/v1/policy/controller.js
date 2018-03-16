//Copyright (c) 2018, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');

function postFromCore (isProduction) {
	return function (req, res, next) {
        helper.validateCorePost(req, res);
		if (res.errorMsg) {
			return res.status(400).send({ error: res.errorMsg });
		}
        helper.generatePolicyTable(isProduction, req.body.policy_table.app_policies, true, handlePolicyTableFlow.bind(null, res));
	}
}

function getPreview (req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';
    helper.generatePolicyTable(isProduction, null, true, handlePolicyTableFlow.bind(null, res));
}

function postAppPolicy (req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';
    helper.validateAppPolicyOnlyPost(req, res);
    if (res.errorMsg) {
        return res.status(400).send({ error: res.errorMsg });
    }
    helper.generatePolicyTable(isProduction, req.body.policy_table.app_policies, false, handlePolicyTableFlow.bind(null, res));
}

function handlePolicyTableFlow (res, err, pieces) {
    if (err) {
        app.locals.log.error(err);
        return res.parcel.setStatus(500).deliver();
    }
    res.parcel
        .setStatus(200)
        .setData(createPolicyTableResponse(pieces));
    return res.parcel.deliver();
}

function createPolicyTableResponse (pieces) {
    return [
        {  
            policy_table: {
                module_config: pieces.moduleConfig,
                functional_groupings: pieces.functionalGroups,
                consumer_friendly_messages: pieces.consumerFriendlyMessages,
                app_policies: pieces.appPolicies
            }
        }
    ]        
}

module.exports = {
    postFromCoreStaging: postFromCore(false),
    postFromCoreProduction: postFromCore(true),
    getPreview: getPreview,
    postAppPolicy: postAppPolicy
};
