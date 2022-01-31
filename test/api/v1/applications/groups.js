const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/groups';

//PUT TESTS

common.startTest('should change functional group selection (selected)', async function () {
    const res = await common.put(endpoint, {app_id: 1, property_name: 'Notifications', is_selected: true});
    expect(res).to.have.status(200);
});

common.startTest('should change functional group selection (unselected)', async function () {
    const res = await common.put(endpoint, {app_id: 1, property_name: 'Notifications', is_selected: false});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 when no parameters are provided', async function () {
    const res = await common.put(endpoint, {});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with missing is_selected', async function () {
    const res = await common.put(endpoint, {app_id: 1, property_name: 'Notifications'});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with missing property_name', async function () {
    const res = await common.put(endpoint, {app_id: 1, is_selected: true});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with missing app_id', async function () {
    const res = await common.put(endpoint, {property_name: 'Notifications', is_selected: true});
    expect(res).to.have.status(400);
});

common.startTest('should not accept an invalid application id', async function () {
    const res = await common.put(endpoint, {app_id: 10000, property_name: 'Notifications', is_selected: true});
    expect(res).to.have.status(400);
});

//GET TESTS

common.startTest('should return an array of assignable non-proprietary functional groups for a valid app id', async function () {
    const res = await common.get(endpoint, {app_id: 1, is_proprietary_group: false, environment: "STAGING"});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.be.an('array').that.is.not.empty;
});

common.startTest('should return an empty array for an invalid app id', async function () {
    const res = await common.get(endpoint, {app_id: 10000, is_proprietary_group: true, environment: "STAGING"});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.be.an('array').that.is.empty;
});

common.startTest('should return an empty array for a valid app id but with is_proprietary_group set to true when theres none available', async function () {
    const res = await common.get(endpoint, {app_id: 1, is_proprietary_group: true, environment: "STAGING"});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.be.an('array').that.is.empty;
});


