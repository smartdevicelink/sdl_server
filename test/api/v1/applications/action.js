var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/applications/action';

// TODO: check if record is updated
common.post(
    'post with id and approval_status',
    endpoint,
    {id: 1, approval_status: 'DENIED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'post with id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'post with approval_status',
    endpoint,
    {approval_status: 'ACCEPTED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'post with invalid approval_status',
    endpoint,
    {id: 1, approval_status: 'INVALID'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

// TODO: check that nothing is returned
common.post(
    'post with invalid id',
    endpoint,
    {id: 10000, approval_status: 'ACCEPTED'},
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
