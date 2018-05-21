var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/policy/preview';

common.get(
    'should get production policy table by default',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.get(
    'should get policy table for given environment',
    endpoint,
    {environment: 'staging'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);
