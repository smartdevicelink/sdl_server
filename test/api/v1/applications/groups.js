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

common.startTest('for an app\'s possible proprietary functional group, change its selected status', async function () {
    const res = await common.get(endpoint, {app_id: 1, is_proprietary_group: true, environment: "STAGING"});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.be.an('array');

    if (res.body.data.groups.length === 0) {
        return; // do not continue the next part if no proprietary groups are found.
    }

    const firstPropertyName = res.body.data.groups[0].property_name;
    const firstPropertySelected = res.body.data.groups[0].is_selected;

    const res2 = await common.put(endpoint, {
        app_id: 1,
        is_selected: !firstPropertySelected, // invert the selection
        property_name: firstPropertyName,
    });

    const res3 = await common.get(endpoint, {app_id: 1, is_proprietary_group: true, environment: "STAGING"});

    expect(res3).to.have.status(200);
    expect(res3.body.data.groups[0].is_selected).to.equal(!firstPropertySelected);
});

//GET TESTS

common.startTest('should return an array of assignable non-proprietary functional groups for an app', async function () {
    const res = await common.get(endpoint, {app_id: 1, is_proprietary_group: false, environment: "STAGING"});
    expect(res).to.have.status(200);
    expect(res.body.data.groups).to.be.an('array').that.is.not.empty;
});




