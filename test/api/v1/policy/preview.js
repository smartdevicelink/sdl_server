var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/policy/preview';

common.get(
    'get with no parameters',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check for correct policy table based on environment
common.get(
    'get with environment',
    endpoint,
    {environment: 'staging'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);
