const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/security/private';

common.startTest('should return a new private key even with no data provided', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data).to.be.a('string');
});

common.startTest('should return a new private key with optional data provided', async function () {
    const res = await common.post(endpoint, {
        options: {
            keyBitsize: "l",
            cipher: "sha-256",
        }
    });
    expect(res).to.have.status(200);
    expect(res.body.data).to.be.a('string');
});
