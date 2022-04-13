const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/administrator';

common.startTest('should add the given uuid to the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, is_administrator_app: true});
    expect(res).to.have.status(200);
});

common.startTest('should remove the given uuid from the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, is_administrator_app: false});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with only uuid specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only is_administrator_app specified', async function () {
    const res = await common.post(endpoint, {is_administrator_app: true});
    expect(res).to.have.status(400);
});

common.startTest('should not add invalid uuid to the app_oem_enablements table', async function () {
    const res = await common.post(endpoint, {uuid: 'INVALID', is_administrator_app: true});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with invalid is_administrator_app', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, is_administrator_app: 7});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});

