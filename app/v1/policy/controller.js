//Copyright (c) 2018, Livio, Inc.
const app = require('../app');
const helper = require('./helper.js');
const encryption = require('../../../customizable/encryption');
const GET = require('lodash').get;

function postFromCore (isProduction) {
	return function (req, res, next) {
        // attempt decryption of the policy table if it's defined
        function processPolicies(policy_table){
            helper.validateCorePost(req, res);
            if (res.errorMsg) {
                return res.status(400).send({ error: res.errorMsg });
            }
            const useLongUuids = GET(policy_table, "module_config.full_app_id_supported", false) ? true : false;
            helper.generatePolicyTable(isProduction, useLongUuids, policy_table.app_policies, true, handlePolicyTableFlow.bind(null, res, isProduction));
        }

        encryption.decryptPolicyTable(req.body.policy_table, isProduction, function(policy_table){
            processPolicies(policy_table);
        });
	}
}

function getPreview (req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';
    helper.generatePolicyTable(isProduction, false, {}, true, handlePolicyTableFlow.bind(null, res, isProduction));
}

function postAppPolicy (req, res, next) {
    const isProduction = !req.query.environment || req.query.environment.toLowerCase() !== 'staging';
	const useLongUuids = GET(req, "body.policy_table.module_config.full_app_id_supported", false) ? true : false;
    helper.validateAppPolicyOnlyPost(req, res);
    if (res.errorMsg) {
        return res.status(400).send({ error: res.errorMsg });
    }
    helper.generatePolicyTable(isProduction, useLongUuids, req.body.policy_table.app_policies, false, handlePolicyTableFlow.bind(null, res, isProduction));
}

function handlePolicyTableFlow (res, isProduction, err, returnPreview = false, pieces) {
    if (err) {
        app.locals.log.error(err);
        return res.parcel.setStatus(500).deliver();
    }
    //convert from this point down to asynchronous to make use of certificate library
    createPolicyTableResponse(res, isProduction, pieces, returnPreview);
}

function createPolicyTableResponse (res, isProduction, pieces, returnPreview = false) {
	const policy_table = [
        {
            policy_table: {
                module_config: pieces.moduleConfig,
                vehicle_data: pieces.vehicleData,
                functional_groupings: pieces.functionalGroups,
                consumer_friendly_messages: pieces.consumerFriendlyMessages,
                app_policies: pieces.appPolicies,
            }
        }
    ];
    return (!returnPreview ? encryption.encryptPolicyTable(isProduction, policy_table,
        function(policy_table){
            res.parcel.setStatus(200)
                .setData(policy_table)
                .deliver();
        }) : res.parcel.setStatus(200)
            .setData(policy_table)
            .deliver());
}

module.exports = {
    postFromCoreStaging: postFromCore(false),
    postFromCoreProduction: postFromCore(true),
    getPreview: getPreview,
    postAppPolicy: postAppPolicy
};
