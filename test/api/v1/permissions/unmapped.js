var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/permissions/unmapped';

common.get(
    'should get unmapped permissions in staging',
    endpoint,
    {environment: 'staging'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.get(
    'should get unmapped permissions in production',
    endpoint,
    {environment: 'production'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.get(
    'should get unmapped production permissions when no environment is specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);
