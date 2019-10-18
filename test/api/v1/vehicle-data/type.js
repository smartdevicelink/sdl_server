var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/vehicle-data/type';

common.get(
    'should get all valid types',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.type).to.have.lengthOf.above(0);
        done();
    }
);
