const moment = require('moment');


//must be run in the root directory.
const config = require('../../../settings'); //configuration module
const log = require(`../../../custom/loggers/${config.loggerModule}/index.js`);


console.log(`config`,config);
const db = require(`../../../custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded
const ReportingService = require('../../../lib/reporting/ReportingService');
const expect = require('chai').expect;

/**@type {ReportingService} **/
let reportingService;


//mocha --bail --exit
describe('update from policy table', () => {


  it('init services', async () => {
    reportingService = new ReportingService({db})
  });

  it('old device', async () => {
    let result = await reportingService.updateReporting({
      device_data: {
        "old": { //device id from core
          "carrier": "",
          "connection_type": "BTMAC",
          "hardware": "Pixel",
          "os": "Android",
          // "os_version": "8.1.0",
          "os_version": "8.1.1",
        },
      }
    },
      moment().subtract(60,'days').toDate());
  })

  it('basic test', async () => {
      // console.log(`reporting`);
      // db.sqlCommand();
      //
      let result = await reportingService.updateReporting({
          device_data: {
      "1280e3a858d9ab45ed129c2205abb7443eb6797e3fc23f38180879b5090c731f": { //device id from core
            "carrier": "",
              "connection_type": "BTMAC",
              "hardware": "Pixel",
              "os": "Android",
              "os_version": "8.1.2"
          },
            "test2": { //device id from core
              "carrier": "",
              "connection_type": "BTMAC",
              "hardware": "Pixel",
              "os": "Android",
              "os_version": "8.1.5"
            },
            "test1": { //device id from core
              "carrier": "",
              "connection_type": "BTMAC",
              "hardware": "Pixel",
              "os": "Android",
              "os_version": "8.1.0"
            }
          }
      });

    expect(result.success).to.be.true;
    // const query = {
    //   text: 'INSERT INTO reporting_detail(name) VALUES($1)',
    //   values: ['brianc'],
    // };



  });



  it('populate last 30 days', async () => {
    // console.log(`reporting`);
    // db.sqlCommand();


    for (let i = 0; i < 30; i++)
    {


      let result = await reportingService.updateReporting({
          device_data: {
            "old": { //device id from core
              "carrier": "",
              "connection_type": "BTMAC",
              "hardware": "Pixel",
              "os": "Android",
              // "os_version": "8.1.0",
              "os_version": "8.1.1",
            },
          },
        //30ea6bce91 test phone number1 IOS
          "usage_and_error_counts": {
            "app_level": {
              "30ea6bce91": {
                "count_of_user_selections": 1,
                "count_of_rejected_rpc_calls": 2,
                "minutes_in_hmi_background": 2,
                "minutes_in_hmi_full": 1,
                "minutes_in_hmi_limited": 1,
                "minutes_in_hmi_none": 1
              },
            }
          }


        },
        moment().subtract(i,'days').toDate(),
        false);
      expect(result.success).to.be.true;

    }

  })

  //usage_and_error_counts


  it('usage_and_error_counts', async () => {
    // console.log(`reporting`);
    // db.sqlCommand();
    //
    let result = await reportingService.updateReporting({
      //TODO what if (probably likely) this spans multiple days and so we cannot associate specific days with this usage.
      //solution: multiple users will create an aggregate that is closer to what is actually going on.
      usage_and_error_counts: { //app usage since last update.
        "2aa52453-dec2-415f-bacc-2908557e003a": {
          "count_of_user_selections": 0,
          "count_of_rejected_rpc_calls":0,
          "minutes_in_hmi_background": 0,
          "minutes_in_hmi_full": 0,
          "minutes_in_hmi_limited": 0,
          "minutes_in_hmi_none": 0
        }
      }
    });

    expect(result.success).to.be.true;


  });


  it('exit connections', (done) => {
    done();
  })

})
