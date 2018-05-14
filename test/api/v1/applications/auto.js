var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/applications/auto';

// TODO: check if app is added to auto approve table
common.post(
    'post with uuid and is_auto_approved_enabled',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802', is_auto_approved_enabled: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'post with uuid',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'post with is_auto_approved_enabled',
    endpoint,
    {is_auto_approved_enabled: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

// TODO: check that nothing was added to the auto approve table
common.post(
    'post with invalid uuid',
    endpoint,
    {uuid: 'INVALID', is_auto_approved_enabled: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'post with invalid is_auto_approved_enabled',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802', is_auto_approved_enabled: 7},
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
