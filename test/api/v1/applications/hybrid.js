const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/hybrid';

common.post(
    'should add the given uuid to the app_hybrid_preference table with value CLOUD',
    endpoint,
    {uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6', hybrid_preference: "CLOUD"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should add the given uuid to the app_hybrid_preference table with value MOBILE',
    endpoint,
    {uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6', hybrid_preference: "MOBILE"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should add the given uuid to the app_hybrid_preference table with value BOTH',
    endpoint,
    {uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6', hybrid_preference: "BOTH"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should return 500 with only uuid specified',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(500);
        done();
    }
);

common.post(
    'should return 400 with only hybrid_preference specified',
    endpoint,
    {hybrid_preference: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should not add invalid uuid to the app_hybrid_preference table',
    endpoint,
    {uuid: 'INVALID', hybrid_preference: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with invalid hybrid_preference',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802', hybrid_preference: "TESTING"},
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
