var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/applications/action';

common.post(
    'should change application status',
    endpoint,
    {id: 1, approval_status: 'LIMITED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 with only id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with only approval_status',
    endpoint,
    {approval_status: 'ACCEPTED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with invalid approval_status',
    endpoint,
    {id: 1, approval_status: 'INVALID'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should not change status fo an invalid application id',
    endpoint,
    {id: 10000, approval_status: 'ACCEPTED'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 when no body is specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
