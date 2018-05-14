var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/groups';

// TODO: check if info is correct
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

// TODO: check if info is correct
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

// TODO: check if info is correct
common.get(
    'get with id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check if info is correct
common.get(
    'get with invalid id',
    endpoint,
    {id: 1000},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

// TODO: check that group is created or altered
common.post(
    'post with name, is_default, and rpcs',
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
    'post with invalid name',
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
    'post with invalid is_default',
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
    'post with no body',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
