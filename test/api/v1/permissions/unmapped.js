const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/permissions/unmapped';

common.startTest('should get unmapped permissions in staging', async function () {
    const res = await common.post(endpoint, {environment: 'staging'});
    expect(res).to.have.status(200);
});

common.startTest('should get unmapped permissions in production', async function () {
    const res = await common.post(endpoint, {environment: 'production'});
    expect(res).to.have.status(200);
});

common.startTest('should get unmapped production permissions when no environment is specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(200);
});
