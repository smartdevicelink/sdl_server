const common = require('../../../common');
const expect = common.expect;
const endpoint = '/api/v1/module';

common.startTest('should get module config with given id', async function () {
    const res = await common.get(endpoint, {id: 1});
    expect(res).to.have.status(200);
    expect(res.body.data.module_configs).to.have.lengthOf(1);
});

common.startTest('should not return any module config with invalid id', async function () {
    const res = await common.get(endpoint, {id: 1000});
    expect(res).to.have.status(200);
    expect(res.body.data.module_configs).to.have.lengthOf(0);
});

common.startTest('should get the most recent module config', async function () {
    const res = await common.get(endpoint, {});
    expect(res).to.have.status(200);
    expect(res.body.data.module_configs).to.have.lengthOf(1);
});

common.startTest('should create a new staging module config', async function () {
    const res = await common.post(endpoint, {
        preloaded_pt: true,
        exchange_after_x_ignition_cycles: 20,
        exchange_after_x_kilometers: 200,
        exchange_after_x_days: 30,
        timeout_after_x_seconds: 15,
        seconds_between_retries: [ 10, 30, 90 ],
        endpoints: {
            '0x04': 'http://localhost:3000/api/1/softwareUpdate',
            queryAppsUrl: 'http://localhost:3000/api/1/queryApps',
            lock_screen_icon_url: 'https://i.imgur.com/TgkvOIZ.png',
            custom_vehicle_data_mapping_url: 'http://oem-example.com'
        },
        endpoint_properties: {
            custom_vehicle_data_mapping_url: {
                version: "1"
            }
        },
        notifications_per_minute_by_priority: {
            EMERGENCY: 60,
            NAVIGATION: 5,
            VOICECOM: 5,
            COMMUNICATION: 5,
            NORMAL: 5,
            NONE: 0,
            PROJECTION: 10
        },
        subtle_notifications_per_minute_by_priority: {
            EMERGENCY: 60,
            NAVIGATION: 5,
            VOICECOM: 5,
            COMMUNICATION: 5,
            NORMAL: 5,
            NONE: 0,
            PROJECTION: 10
        },
        lock_screen_dismissal_enabled: true
    });

    expect(res).to.have.status(200);
});

common.startTest('should return 400 with no body specified', async function () {
    const res = await common.post(endpoint, {});
    expect(res).to.have.status(400);
});
