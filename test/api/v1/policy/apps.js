const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/policy/apps';

common.startTest('should get staging policy objects', async function () {
    const apps = (await common.get('/api/v1/applications', {})).body.data.applications;
    const first3Uuids = apps.map(app => app.uuid).slice(0, 3);
    const appObj = {};
    for (let uuid of first3Uuids) {
        appObj[uuid] = {};
    }

    const res = await common.post(endpoint, {
        policy_table: {
            app_policies: appObj
        },
        environment: "staging"
    });

    expect(res).to.have.status(200);
    expect(Object.keys(res.body.data[0].policy_table.app_policies).length).to.equal(6);
});

common.startTest('should get production policy objects', async function () {
    const apps = (await common.get('/api/v1/applications', {})).body.data.applications;
    const first3Uuids = apps.map(app => app.uuid).slice(0, 3);
    const appObj = {};
    for (let uuid of first3Uuids) {
        appObj[uuid] = {};
    }

    const res = await common.post(endpoint, {
        policy_table: {
            app_policies: appObj
        },
        environment: "production"
    });

    expect(res).to.have.status(200);
    expect(Object.keys(res.body.data[0].policy_table.app_policies).length).to.equal(6);
});

common.startTest('should return 400 with no app policies specified', async function () {
    const res = await common.post(endpoint, {
        policy_table: {},
        environment: "production"
    });

    expect(res).to.have.status(400);
});

common.startTest('should get default permissions for invalid app uuid', async function () {
    const res = await common.post(endpoint, {
        policy_table: {
            app_policies: {
                "INVALID_APP": {}
            }
        }
    });

    expect(res).to.have.status(200);
    expect(Object.keys(res.body.data[0].policy_table.app_policies).length).to.equal(4);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});
