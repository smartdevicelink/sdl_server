const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/messages/update';

common.startTest('should update the list of languages', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(200);
});
