var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/applications';

common.get(
    'should return all applications',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        //expect(res.body.data.applications).to.have.lengthOf.above(0);
        done();
    }
);

common.get(
    'should return the application with the given id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        //expect(res.body.data.applications).to.have.lengthOf(1);
        done();
    }
);

common.get(
    'should return the applications with the given uuid',
    endpoint,
    {uuid: '4b5145c5-0970-4a42-ba4b-08a9ff47aea3'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        //expect(res.body.data.applications).to.have.lengthOf.above(0);
        done();
    }
);
