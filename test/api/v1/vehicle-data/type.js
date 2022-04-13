const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/vehicle-data/type';

common.startTest('should get all valid types', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.type).to.have.lengthOf.above(0);
});
