const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications';

common.startTest('should return all applications', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.applications).to.have.lengthOf.above(0);
});

common.startTest('should return the application with the given id', async function () {
    const res = await common.get(endpoint, {id: 1});
    expect(res).to.have.status(200);
    expect(res.body.data.applications).to.have.lengthOf(1);
});

common.startTest('should return the application with the given uuid', async function () {
    const uuid = (await common.get(endpoint, {id: 1})).body.data.applications[0].uuid;
    const res = await common.get(endpoint, {uuid: uuid});
    expect(res).to.have.status(200);
    expect(res.body.data.applications).to.have.lengthOf.above(0);
});