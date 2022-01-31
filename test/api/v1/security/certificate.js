const chai = require('chai');
const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/security/certificate';

common.startTest('should return a new certificate even with no data provided', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.certificate).to.be.a('string');
});

common.startTest('should return a new certificate with optional data provided', async function () {
    const res = await common.post(endpoint, {
        options: {
            country: "US",
            state: "test",
            locality: "test",
            organization: "test",
            organizationUnit: "test",
            commonName: "test",
            emailAddress: "test",
            days: 4,
        }
    });
    expect(res).to.have.status(200);
    expect(res.body.data.certificate).to.be.a('string');
});

common.startTest('should return a new certificate with the same private key if it was passed in as an argument', async function () {
    const res = await common.post('/api/v1/security/private', {});
    expect(res).to.have.status(200);
    expect(res.body.data).to.be.a('string');

    const privateKey = res.body.data;

    const res2 = await common.post(endpoint, {
        options: {
            clientKey: privateKey,
        }
    });

    expect(res2).to.have.status(200);
    expect(res2.body.data.certificate).to.be.a('string');
    expect(res2.body.data.clientKey).to.equal(privateKey);
});