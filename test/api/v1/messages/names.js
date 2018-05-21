var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/messages/names';

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
