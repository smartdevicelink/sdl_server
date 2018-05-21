var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/groups/promote';

common.post(
    'should promote group to production',
    endpoint,
    {id: [ 1 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should promote groups to production',
    endpoint,
    {id: [ 2, 3, 4 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should not promote group with invalid id',
    endpoint,
    {id: [ 1000 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 with no body',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
