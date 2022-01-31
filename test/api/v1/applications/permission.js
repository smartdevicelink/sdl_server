const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/applications/service/permission';

common.startTest('should add the application service permission info to the app_service_type_permissions table', async function () {
    const res = await common.put(endpoint, {id: 1, is_selected: true, service_type_name: "MEDIA", permission_name: "ButtonPress"});
    expect(res).to.have.status(200);
});

common.startTest('should remove the application service permission info from the app_service_type_permissions table', async function () {
    const res = await common.put(endpoint, {id: 1, is_selected: false, service_type_name: "MEDIA", permission_name: "ButtonPress"});
    expect(res).to.have.status(200);
});

common.startTest('should return 400 using an invalid id', async function () {
    const res = await common.put(endpoint, {id: -1, is_selected: false, service_type_name: "MEDIA", permission_name: "ButtonPress"});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only id', async function () {
    const res = await common.put(endpoint, {id: 1});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only is_selected', async function () {
    const res = await common.put(endpoint, {is_selected: false});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only service_type_name', async function () {
    const res = await common.put(endpoint, {service_type_name: "MEDIA"});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with only permission_name', async function () {
    const res = await common.put(endpoint, {permission_name: "ButtonPress"});
    expect(res).to.have.status(400);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.put(endpoint, {});
    expect(res).to.have.status(400);
});

