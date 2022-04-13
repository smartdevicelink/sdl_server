const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/groups/names';

common.startTest('get with no parameters', async function () {
    const groups = (await common.get('/api/v1/groups', {environment: 'staging'})).body.data.groups;
    const groupNames = groups.map(group => group.name);

    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.names).to.have.lengthOf.above(0);

    // check that the data returned from the group names has a corresponding functional group name on staging
    for (let name of res.body.data.names) {
        expect(groupNames.includes(name)).to.equal(true);
    }
});