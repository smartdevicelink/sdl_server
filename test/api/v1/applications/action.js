const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/action';

common.startTest('should change application status', async function () {
    const res = await common.post(endpoint, {id: 1, approval_status: 'LIMITED'});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with only id', async function () {
    const res = await common.post(endpoint, {id: 1});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only approval_status', async function () {
    const res = await common.post(endpoint, {approval_status: 'ACCEPTED'});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with invalid approval_status', async function () {
    const res = await common.post(endpoint, {id: 1, approval_status: 'INVALID'});
    expect(res).to.have.status(400);
});

common.startTest('should not change status for an invalid application id', async function () {
    const res = await common.post(endpoint, {id: 10000, approval_status: 'ACCEPTED'});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 when no body is specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});