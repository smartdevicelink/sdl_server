var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/module';

common.get(
    'should get module config with given id',
    endpoint,
    {id: 1},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.module_configs).to.have.lengthOf(1);
        done();
    }
);

common.get(
    'should not return any module config with invalid id',
    endpoint,
    {id: 1000},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.module_configs).to.have.lengthOf(0);
        done();
    }
);

common.get(
    'should get the most recent module config',
    endpoint,
    {},
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.data.module_configs).to.have.lengthOf(1);
        done();
    }
);

common.post(
    'should create a new staging module config',
    endpoint,
    {
        preloaded_pt: true,
        exchange_after_x_ignition_cycles: 20,
        exchange_after_x_kilometers: 777,
        exchange_after_x_days: 30,
        timeout_after_x_seconds: 15,
        seconds_between_retries: [ 10, 30, 90 ],
        endpoints: {
            '0x04': 'http://localhost:3000/api/1/softwareUpdate',
            queryAppsUrl: 'http://localhost:3000/api/1/queryApps',
            lock_screen_icon_url: 'https://i.imgur.com/TgkvOIZ.png'
        },
        notifications_per_minute_by_priority: {
            EMERGENCY: 60,
            NAVIGATION: 5,
            VOICECOM: 5,
            COMMUNICATION: 5,
            NORMAL: 5,
            NONE: 0
        }
    },
    (err, res, done) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
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
