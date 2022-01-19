const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/permissions/update';

common.startTest('should update permissions', async function () {
    const res = await common.post(endpoint);
    expect(res).to.have.status(200);
});
