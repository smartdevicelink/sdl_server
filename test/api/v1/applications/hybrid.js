const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/hybrid';

common.startTest('should add the given uuid to the app_hybrid_preference table with value CLOUD', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, hybrid_preference: "CLOUD"});
    expect(res).to.have.status(200);
});

common.startTest('should add the given uuid to the app_hybrid_preference table with value MOBILE', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, hybrid_preference: "MOBILE"});
    expect(res).to.have.status(200);
});

common.startTest('should add the given uuid to the app_hybrid_preference table with value BOTH', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, hybrid_preference: "BOTH"});
    expect(res).to.have.status(200);
});

common.startTest('should return 500 with only uuid specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid});
    expect(res).to.have.status(500);
});

common.startTest('should return 400 with only hybrid_preference specified', async function () {
    const res = await common.post(endpoint, {hybrid_preference: "BOTH"});
    expect(res).to.have.status(400);
});

common.startTest('should not add invalid uuid to the app_hybrid_preference table', async function () {
    const res = await common.post(endpoint, {uuid: 'INVALID', hybrid_preference: "BOTH"});
    expect(res).to.have.status(500);
});

common.startTest('should return 400 with invalid hybrid_preference', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {uuid: uuid, hybrid_preference: "TESTING"});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});

