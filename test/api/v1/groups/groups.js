var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/groups';

common.get(
    'should get all groups',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.groups).to.have.lengthOf.above(0);
        done();
    }
);

common.get(
    'should get group with given id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.groups).to.have.lengthOf(1);
        done();
    }
);

common.get(
    'should not get any groups with invalid id',
    endpoint,
    {id: 1000},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.groups).to.have.lengthOf(0);
        done();
    }
);

common.post(
    'should add new group',
    endpoint,
    {
        name: 'Blarg',
        is_default: false,
        rpcs: [

        ],
        user_consent_prompt: ''
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 with invalid name type',
    endpoint,
    {
        name: 7,
        is_default: false,
        rpcs: [

        ],
        user_consent_prompt: ''
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with invalid is_default type',
    endpoint,
    {
        name: 'Blarg',
        is_default: 7,
        rpcs: [

        ],
        user_consent_prompt: ''
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with no body specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
