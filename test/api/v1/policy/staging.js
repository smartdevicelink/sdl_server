var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/staging/policy';

common.post(
    'should return staging policy table',
    endpoint,
    {
        policy_table: {
            app_policies: {},
            consumer_friendly_messages: {},
            device_data: {},
            functional_groupings: {},
            module_config: {},
            usage_and_error_counts: {}
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 with invalid policy_table',
    endpoint,
    {
        policy_table: {
            app_policies: {},
            consumer_friendly_messages: {},
            functional_groupings: {},
            module_config: {},
            usage_and_error_counts: {}
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with no body specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
