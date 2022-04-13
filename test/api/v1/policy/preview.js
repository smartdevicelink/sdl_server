const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/policy/preview';

common.startTest('should get production policy table by default', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
});

common.startTest('should get policy table for given environment', async function () {
    const res = await common.get(endpoint, {environment: 'staging'});
    expect(res).to.have.status(200);
});
