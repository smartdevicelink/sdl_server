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

function generateCertificate (done) {
    chai.request(common.BASE_URL)
        .post('/api/v1/security/certificate')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
        .send({})
        .end(done);
}

it('should store an app certificate with valid cert and key data', (done) => {
    generateCertificate( (err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.have.nested.property('body.data.certificate');
        expect(res).to.have.nested.property('body.data.serviceKey');

        //store thee cert and key received
        chai.request(common.BASE_URL)
            .post(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
            .send({
                options: {
                    app_uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6',
                    clientKey: res.body.data.clientKey, 
                    certificate: res.body.data.certificate,
                },
            })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            });
    });
});

common.post(
    'should fail storing an app certificate with invalid cert and key data',
    endpoint,
    {
        options: {
            app_uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6',
            clientKey: 'test1', 
            certificate: 'test2',
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(500);
        done();
    }
);

common.post(
    'should fail storing an app certificate with no app uuid',
    endpoint,
    {
        options: {
            clientKey: 'test1', 
            certificate: 'test2',
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should fail storing an app certificate with no clientKey',
    endpoint,
    {
        options: {
            app_uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6',
            certificate: 'test2',
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should fail storing an app certificate with no certificate',
    endpoint,
    {
        options: {
            app_uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6',
            clientKey: 'test1', 
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

it('should return 400 when storing a certificate with an invalid app uuid', (done) => {
    generateCertificate( (err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res).to.have.nested.property('body.data.certificate');
        expect(res).to.have.nested.property('body.data.serviceKey');

        //store thee cert and key received
        chai.request(common.BASE_URL)
            .post(endpoint)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
            .send({
                options: {
                    app_uuid: '-1',
                    clientKey: res.body.data.clientKey, 
                    certificate: res.body.data.certificate,
                },
            })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
    });
});
