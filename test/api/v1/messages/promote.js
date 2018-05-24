var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/messages/promote';

common.post(
    'should promote the message with the given id',
    endpoint,
    {id: [ 1 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should promote the messages with the given ids',
    endpoint,
    {id: [ 2, 3, 4 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should not promote message with invalid id',
    endpoint,
    {id: [ 1000 ]},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
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
