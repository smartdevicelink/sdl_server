const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/rpcencryption';

common.startTest('should change the apps encryption required status to true', async function () {
    const res = await common.put(endpoint, {id: 1, encryption_required: true});
    expect(res).to.have.status(200);
});

common.startTest('should change the apps encryption required status to false', async function () {
    const res = await common.put(endpoint, {id: 1, encryption_required: false});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with only id specified', async function () {
    const res = await common.put(endpoint, {id: 1});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only encryption_required specified', async function () {
    const res = await common.put(endpoint, {encryption_required: true});
    expect(res).to.have.status(400);
});

common.startTest('should not succeed with an invalid id', async function () {
    const res = await common.put(endpoint, {id: -1, encryption_required: true});
    expect(res).to.have.status(500);
});

common.startTest('should not succeed with an invalid encryption_required', async function () {
    const res = await common.put(endpoint, {id: -1, encryption_required: "nope"});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.put(endpoint, {});
    expect(res).to.have.status(400);
});

