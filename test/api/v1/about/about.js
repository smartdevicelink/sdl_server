const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/about';

common.startTest('should return information about the policy server configuration', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data).to.be.an('object');
});
