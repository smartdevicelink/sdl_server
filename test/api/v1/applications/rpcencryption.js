const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/rpcencryption';

common.put(
    'should change the apps encryption required status to true',
    endpoint,
    {id: 1, encryption_required: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.put(
    'should change the apps encryption required status to false',
    endpoint,
    {id: 1, encryption_required: false},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.put(
    'should return 400 with only id specified',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with only encryption_required specified',
    endpoint,
    {encryption_required: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should not succeed with an invalid id',
    endpoint,
    {id: -1, encryption_required: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(500);
        done();
    }
);

common.put(
    'should not succeed with an invalid encryption_required',
    endpoint,
    {id: -1, encryption_required: "nope"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with no body specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
