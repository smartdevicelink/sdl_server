var common = require('../../../common');
var expect = common.expect;
var endpoint = '/api/v1/module/promote';

common.post(
    'should create new production module config',
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


common.get(
  'check lock_screen_dismissal_enabled defaults to false',
  `/api/v1/module`,
  {
  },
  (err, res, done) => {
      expect(res).to.have.status(200);
      expect(res.body.data.module_configs).to.have.lengthOf(1);
      expect(res.body.data.module_configs[0].lock_screen_dismissal_enabled).to.be.equal(false);
      done();
  }
);


common.post(
  'should create new production module config lock_screen_dismissal_enabled',
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
      },
      lock_screen_dismissal_enabled: true
  },
  (err, res, done) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      //not able to check output in post
      done();
  }
);


common.get(
  'check lock_screen_dismissal_enabled set to true',
  `/api/v1/module`,
  {
  },
  (err, res, done) => {
      expect(res).to.have.status(200);
      expect(res.body.data.module_configs).to.have.lengthOf(1);
      expect(res.body.data.module_configs[0].lock_screen_dismissal_enabled).to.be.equal(true);
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
