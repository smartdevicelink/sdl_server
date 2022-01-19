const chai = require('chai');
const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/certificate';

if (!common.config.certificateAuthority.authorityKeyFileName ||
    !common.config.certificateAuthority.authorityCertFileName ||
    !common.config.securityOptions.passphrase ||
    !common.config.securityOptions.certificate.commonName) {
    //skip
    return;
}

async function generateCertificate () {
    const res = await common.post('/api/v1/security/certificate', {});
    expect(res).to.have.status(200);
    expect(res).to.have.nested.property('body.data.certificate');
    expect(res).to.have.nested.property('body.data.serviceKey');
    return res.body.data;
}

common.startTest('should store an app certificate with valid cert and key data', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const certData = await generateCertificate();
    //store the cert and key received
    const res = await common.post(endpoint, {
        options: {
            app_uuid: uuid,
            clientKey: certData.clientKey, 
            certificate: certData.certificate,
        },
    });
    expect(res).to.have.status(200);
});

common.startTest('should fail storing an app certificate with invalid cert and key data', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    //store the cert and key received
    const res = await common.post(endpoint, {
        options: {
            app_uuid: uuid,
            clientKey: 'test1', 
            certificate: 'test2',
        }
    });
    expect(res).to.have.status(500);
});

common.startTest('should fail storing an app certificate with no app uuid', async function () {
    const certData = await generateCertificate();
    //store the cert and key received
    const res = await common.post(endpoint, {
        options: {
            clientKey: certData.clientKey,
            certificate: certData.certificate
        }
    });
    expect(res).to.have.status(400);
});

common.startTest('should fail storing an app certificate with no clientKey', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const certData = await generateCertificate();
    //store the cert and key received
    const res = await common.post(endpoint, {
        options: {
            app_uuid: uuid,
            certificate: certData.certificate
        },
    });
    expect(res).to.have.status(400);
});

common.startTest('should fail storing an app certificate with no certificate', async function () {
    const uuid = (await common.get('/api/v1/applications', {id: 1})).body.data.applications[0].uuid;
    const certData = await generateCertificate();
    //store the cert and key received
    const res = await common.post(endpoint, {
        options: {
            app_uuid: uuid,
            clientKey: certData.clientKey
        },
    });
    expect(res).to.have.status(400);
});

common.startTest('should return 400 when storing a certificate with an invalid app uuid', async function () {
    const certData = await generateCertificate();
    //store the cert and key received
    const res = await common.post(endpoint, {
        options: {
            app_uuid: '-1',
            clientKey: certData.clientKey, 
            certificate: certData.certificate,
        },
    });
    expect(res).to.have.status(400);
});

