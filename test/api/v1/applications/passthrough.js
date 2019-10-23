const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/passthrough';

common.post(
    'should add the given uuid to the app_oem_enablements table',
    endpoint,
    {uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6', allow_unknown_rpc_passthrough: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.post(
    'should remove the given uuid from the app_oem_enablements table',
    endpoint,
    {uuid: '30ea6bce-91de-4b18-8b52-68d82112eee6', allow_unknown_rpc_passthrough: false},
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
    'should return 400 with only allow_unknown_rpc_passthrough specified',
    endpoint,
    {allow_unknown_rpc_passthrough: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should not add invalid uuid to the app_oem_enablements table',
    endpoint,
    {uuid: 'INVALID', allow_unknown_rpc_passthrough: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.post(
    'should return 400 with invalid allow_unknown_rpc_passthrough',
    endpoint,
    {uuid: 'dfda5c35-700e-487e-87d2-ea4b2c572802', allow_unknown_rpc_passthrough: 7},
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
