const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/webhook';

common.startTest('should fail when not including the public_key property', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {
        uuid: uuid,
        entity: "application",
        action: "UPSERT"
    });

    expect(res).to.have.status(401);
});

common.startTest('should fail when using the wrong public_key value', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.postWebhook(endpoint, {
        uuid: uuid,
        entity: "application",
        action: "UPSERT"
    }, 'nope');

    expect(res).to.have.status(401);
});

common.startTest('should query SHAID for an update to an application', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.postWebhook(endpoint, {
        uuid: uuid,
        entity: "application",
        action: "UPSERT"
    }, process.env.SHAID_PUBLIC_KEY);

    expect(res).to.have.status(200);
});

common.startTest('should query SHAID and blacklist an application', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.postWebhook(endpoint, {
        uuid: uuid,
        entity: "application",
        action: "BLACKLIST"
    }, process.env.SHAID_PUBLIC_KEY);

    expect(res).to.have.status(200);
});

common.startTest('should query SHAID and delete an application', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.postWebhook(endpoint, {
        uuid: uuid,
        entity: "application",
        action: "DELETE"
    }, process.env.SHAID_PUBLIC_KEY);

    expect(res).to.have.status(200);
});