var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/messages/update';

// TODO: check that the languages were updated
common.post(
    'post with no body',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);
