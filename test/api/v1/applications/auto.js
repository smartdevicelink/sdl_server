const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/auto';

common.startTest('should add the given uuid to the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, is_auto_approved_enabled: true});
    expect(res).to.have.status(200);
});

common.startTest('should remove the given uuid to the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, is_auto_approved_enabled: false});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with only uuid specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only is_auto_approved_enabled specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {is_auto_approved_enabled: true});
    expect(res).to.have.status(400);
});

common.startTest('should not add invalid uuid to the app_oem_enablements table', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: 'INVALID', is_auto_approved_enabled: true});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with invalid is_auto_approved_enabled', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802', is_auto_approved_enabled: 7});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});
