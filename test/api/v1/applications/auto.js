var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/applications/auto';

common.post(
    'should add the given uuid to the auto approve table',
    endpoint,
    {uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6', is_auto_approved_enabled: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 400 with only uuid specified',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with only is_auto_approved_enabled specified',
    endpoint,
    {is_auto_approved_enabled: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should not add invalid uuid to the auto approve table',
    endpoint,
    {uuid: 'INVALID', is_auto_approved_enabled: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with invalid is_auto_approved_enabled',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802', is_auto_approved_enabled: 7},
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
