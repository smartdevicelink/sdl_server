var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/messages/update';

common.post(
    'should update the list of languages',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);
