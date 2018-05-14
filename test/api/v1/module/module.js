var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/module';

// TODO: check that info is correct
common.get(
    'get with environment and id',
    endpoint,
    {environment: 'staging', id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check that info is correct
common.get(
    'get with invalid environment',
    endpoint,
    {environment: 'INVALID', id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check that info is correct
common.get(
    'get with invalid id',
    endpoint,
    {environment: 'staging', id: 1000},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check that info is correct
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

common.post(
    'post with no body',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
