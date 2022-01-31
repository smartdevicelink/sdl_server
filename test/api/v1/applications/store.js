const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/store';
const endpointStaging = '/api/v1/applications/store/staging';

common.startTest('should retrieve all embedded staging applications', async function () {
    const res = await common.get('/api/v1/applications', {});
    const webengineApps = res.body.data.applications.filter(app => app.platform === 'EMBEDDED');

    // put all webengine apps on STAGING. these should then be viewable in the staging route
    for (let app of webengineApps) {
    	await common.post('/api/v1/applications/action', {id: app.id, approval_status: 'STAGING'});
    }

    const res2 = await common.get(endpointStaging, {});
    expect(res2).to.have.status(200);

    let webengineNames = webengineApps.map(app => app.name);

    for (let app of res2.body.data.applications) {
        expect(webengineNames.includes(app.name)).to.equal(true);
    }
});

common.startTest('should retrieve one embedded staging application', async function () {
    const res = await common.get(endpointStaging, {});
    const apps = res.body.data.applications;


    const res2 = await common.get(endpointStaging, {uuid: apps[0].policyAppID});
    expect(res2).to.have.status(200);
    expect(res2.body.data.applications).to.have.lengthOf(1);
});

common.startTest('should succeed in retrieving staging applications with transport_type data', async function () {
    const res = await common.get(endpointStaging, {
    	transport_type: 'websocket'
    });

    expect(res).to.have.status(200);
});

common.startTest('should retrieve all embedded production applications', async function () {
    const res = await common.get('/api/v1/applications', {});
    const webengineApps = res.body.data.applications.filter(app => app.platform === 'EMBEDDED');

    // put all webengine apps on PRODUCTION. these should then be viewable in the staging route
    for (let app of webengineApps) {
    	await common.post('/api/v1/applications/action', {id: app.id, approval_status: 'ACCEPTED'});
    }

    const res2 = await common.get(endpoint, {});
    expect(res2).to.have.status(200);

    let webengineNames = webengineApps.map(app => app.name);

    for (let app of res2.body.data.applications) {
        expect(webengineNames.includes(app.name)).to.equal(true);
    }
});

common.startTest('should retrieve one embedded production application', async function () {
    const res = await common.get(endpoint, {});
    const apps = res.body.data.applications;

    const res2 = await common.get(endpoint, {uuid: apps[0].policyAppID});
    expect(res2).to.have.status(200);
    expect(res2.body.data.applications).to.have.lengthOf(1);
});

common.startTest('should succeed in retrieving production applications with transport_type data', async function () {
    const res = await common.get(endpoint, {
    	transport_type: 'websocket'
    });

    expect(res).to.have.status(200);
});
