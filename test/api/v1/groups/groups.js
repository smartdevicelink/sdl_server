const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/groups';

common.startTest('should get all groups', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.have.lengthOf.above(0);
});

common.startTest('should get group with given id', async function () {
    const res = await common.get(endpoint, {id: 1});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.have.lengthOf(1);
});

common.startTest('should not get any groups with invalid id', async function () {
    const res = await common.get(endpoint, {id: 1000});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.have.lengthOf(0);
});

common.startTest('should add new group', async function () {
    const res = await common.post(endpoint, {
        name: 'Blarg',
        is_default: false,
        rpcs: [],
        user_consent_prompt: ''
    });
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with invalid name type', async function () {
    const res = await common.post(endpoint, {
        name: 7,
        is_default: false,
        rpcs: [],
        user_consent_prompt: ''
    });
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with invalid is_default type', async function () {
    const res = await common.post(endpoint, {
        name: 'Blarg',
        is_default: 7,
        rpcs: [],
        user_consent_prompt: ''
    });
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});

