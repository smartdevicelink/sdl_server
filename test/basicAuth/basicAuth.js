var common = require('../common');
var chai = common.chai;
var BASE_URL = common.BASE_URL;
var expect = common.expect;
var config = common.config;

it('should return 401 error when basic auth is enabled and no password header is set', (done) => {
    config.authType = 'basic';
    config.basicAuthPassword = 'test';
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
    config.authType = 'basic';
    config.basicAuthPassword = 'test';
    chai.request(BASE_URL)
        .get('/api/v1/applications')
        .set('Accept', 'application/json')
        .set('BASIC-AUTH-PASSWORD', config.basicAuthPassword)
        .send()
        .end( (err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            done();
        });
});

it('should request successfully when basic auth is disabled', (done) => {
    config.authType = null;
    config.basicAuthPassword = null;
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
