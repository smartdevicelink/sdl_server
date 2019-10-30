const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/groups';

//PUT TESTS

common.put(
    'should change functional group selection (selected)',
    endpoint,
    {app_id: 1, property_name: 'Notifications', is_selected: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.put(
    'should change functional group selection (unselected)',
    endpoint,
    {app_id: 1, property_name: 'Notifications', is_selected: false},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
    }
);

common.put(
    'should return 400 when no parameters are provided',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with missing is_selected',
    endpoint,
    {app_id: 1, property_name: 'Notifications'},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with missing property_name',
    endpoint,
    {app_id: 1, is_selected: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should return 400 with missing app_id',
    endpoint,
    {property_name: 'Notifications', is_selected: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);

common.put(
    'should not accept an invalid application id',
    endpoint,
    {app_id: 10000, property_name: 'Notifications', is_selected: true},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(400);
        done();
    }
);


//GET TESTS

common.get(
    'should return an array of assignable non-proprietary functional groups for a valid app id',
    endpoint,
    {app_id: 1, is_proprietary_group: false, environment: "STAGING"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.groups).to.be.an('array').that.is.not.empty;
        done();
    }
);

common.get(
    'should return an empty array for an invalid app id',
    endpoint,
    {app_id: 10000, is_proprietary_group: true, environment: "STAGING"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.groups).to.be.an('array').that.is.empty;
        done();
    }
);

common.get(
    'should return an empty array for a valid app id but with is_proprietary_group set to true when theres none available',
    endpoint,
    {app_id: 1, is_proprietary_group: true, environment: "STAGING"},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.groups).to.be.an('array').that.is.empty;
        done();
    }
);


