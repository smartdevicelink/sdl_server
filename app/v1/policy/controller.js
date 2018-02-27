const app = require('../app');
const helper = require('./helper.js');

function postFromCore (isProduction) {
	return function (req, res, next) {
        helper.validateCorePost(req, res);
		if (res.errorMsg) {
			return res.status(400).send({ error: res.errorMsg });
		}
        helper.generatePolicyTable(isProduction, req.body.policy_table.app_policies, true, function (err, pieces) {
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
    helper.generatePolicyTable(isProduction, null, true, function (err, pieces) {
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
    helper.validateAppPolicyOnlyPost(req, res);
    if (res.errorMsg) {
        return res.status(400).send({ error: res.errorMsg });
    }
    helper.generatePolicyTable(isProduction, req.body.policy_table.app_policies, false, function (err, pieces) {
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

module.exports = {
    postFromCoreStaging: postFromCore(false),
    postFromCoreProduction: postFromCore(true),
    getPreview: getPreview,
    postAppPolicy: postAppPolicy
};
