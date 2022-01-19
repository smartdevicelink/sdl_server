const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/production/policy';

common.startTest('should return staging policy table', async function () {
    const res = await common.post(endpoint, {
        policy_table: {
            app_policies: {},
            consumer_friendly_messages: {},
            device_data: {},
            functional_groupings: {},
            module_config: {},
            usage_and_error_counts: {}
        }
    });
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with invalid policy_table', async function () {
    const res = await common.post(endpoint, {
        policy_table: {
            app_policies: {},
            consumer_friendly_messages: {},
            functional_groupings: {},
            module_config: {},
            usage_and_error_counts: {}
        }
    });
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});

