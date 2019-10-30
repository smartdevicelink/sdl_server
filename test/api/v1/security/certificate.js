const chai = require('chai');
const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/security/certificate';

common.post(
    'should return a new certificate even with no data provided',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.certificate).to.be.a('string');
        done();
    }
);

common.post(
    'should return a new certificate with optional data provided',
    endpoint,
    {
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
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.certificate).to.be.a('string');
        done();
    }
);

it('should return a new certificate with the same private key if it was passed in as an argument', (done) => {
    chai.request(common.BASE_URL)
        .post('/api/v1/security/private')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
        .send({})
        .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a('string');

            const privateKey = res.body.data;

            chai.request(common.BASE_URL)
                .post(endpoint)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('BASIC-AUTH-PASSWORD', common.config.basicAuthPassword)
                .send({
                    options: {
                        clientKey: privateKey,
                    }
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body.data.certificate).to.be.a('string');
                    expect(res.body.data.clientKey).to.equal(privateKey);
                    done();
                });
        });
});
