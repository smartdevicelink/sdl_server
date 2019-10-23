const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/service/permission';

common.put(
    'should add the application service permission info to the app_service_type_permissions table',
    endpoint,
    {id: 1, is_selected: true, service_type_name: "MEDIA", permission_name: "ButtonPress"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.put(
    'should remove the application service permission info from the app_service_type_permissions table',
    endpoint,
    {id: 1, is_selected: false, service_type_name: "MEDIA", permission_name: "ButtonPress"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.put(
    'should return 400 using an invalid id',
    endpoint,
    {id: -1, is_selected: false, service_type_name: "MEDIA", permission_name: "ButtonPress"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with only id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with only is_selected',
    endpoint,
    {is_selected: false},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with only service_type_name',
    endpoint,
    {service_type_name: "MEDIA"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with only permission_name',
    endpoint,
    {permission_name: "ButtonPress"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with no body specified',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);
