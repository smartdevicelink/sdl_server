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

common.get(
    'should return certificate data for an app (GET)',
    endpoint,
    {appId: '30ea6bce-91de-4b18-8b52-68d82112eee6'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return certificate data for an app (POST)',
    endpoint,
    {appId: '30ea6bce-91de-4b18-8b52-68d82112eee6'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.get(
    'should return 400 with an invalid app id (GET)',
    endpoint,
    {appId: '0'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with an invalid app id (POST)',
    endpoint,
    {appId: '0'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);