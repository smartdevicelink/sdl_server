const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/passthrough';

common.startTest('should add the given uuid to the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, allow_unknown_rpc_passthrough: true});
    expect(res).to.have.status(200);
});

common.startTest('should remove the given uuid from the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, allow_unknown_rpc_passthrough: false});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with only uuid specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only allow_unknown_rpc_passthrough specified', async function () {
    const res = await common.post(endpoint, {allow_unknown_rpc_passthrough: true});
    expect(res).to.have.status(400);
});

common.startTest('should not add invalid uuid to the app_oem_enablements table', async function () {
    const res = await common.post(endpoint, {uuid: 'INVALID', allow_unknown_rpc_passthrough: true});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with invalid allow_unknown_rpc_passthrough', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, allow_unknown_rpc_passthrough: 7});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});