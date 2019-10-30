const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/about';

common.get(
    'should return information about the policy server configuration',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data).to.be.an('object');
        done();
    }
);
