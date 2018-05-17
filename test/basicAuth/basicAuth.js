const config = require('../../settings.js');
var common = require('../common');
var chai = common.chai;
var BASE_URL = common.BASE_URL;
var expect = common.expect;

it('should return 401 error when basic auth is enabled and no password header is set', (done) => {
    chai.request(BASE_URL)
        .get('/api/v1/applications')
        .set('Accept', 'application/json')
        .send()
        .end( (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(401);
            done();
        });
});

it('should request successfully when basic auth is enabled and correct password header is set', (done) => {
    chai.request(BASE_URL)
        .get('/api/v1/applications')
        .set('Accept', 'application/json')
        .set('BASIC-AUTH-PASSWORD', process.env.BASIC_AUTH_PASSWORD)
        .send()
        .end( (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            done();
        });
});

it('should request successfully when basic auth is disabled', (done) => {
    config.authType = null;
    chai.request(BASE_URL)
        .get('/api/v1/applications')
        .set('Accept', 'application/json')
        .send()
        .end( (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            done();
        });
});
