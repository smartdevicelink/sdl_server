const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/certificate/get';

if (!common.config.certificateAuthority.authorityKeyFileName ||
    !common.config.certificateAuthority.authorityCertFileName ||
    !common.config.securityOptions.passphrase ||
    !common.config.securityOptions.certificate.commonName) {
    //skip
    return;
}

common.startTest('should return certificate data for an app (GET)', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.get(endpoint, {appId: uuid});
    expect(res).to.have.status(200);
});

common.startTest('should return certificate data for an app (POST)', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {appId: uuid});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 with an invalid app id (GET)', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.get(endpoint, {appId: '0'});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with an invalid app id (POST)', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const res = await common.post(endpoint, {appId: '0'});
    expect(res).to.have.status(400);
});
