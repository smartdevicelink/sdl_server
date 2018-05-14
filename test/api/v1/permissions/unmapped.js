var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/permissions/unmapped';

// TODO: check if info returned is correct
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

// TODO: check if info returned is correct
common.get(
    'get with invalid environment',
    endpoint,
    {environment: 'INVALID'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check if info returned is correct
common.get(
    'get with environment',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);
