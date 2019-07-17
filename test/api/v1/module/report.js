// var common = require('../../../common');
// var expect = common.expect;
var endpoint = '/api/v1/applications';
const config = require('../../../../settings.js');

let defaultUrl = 'http://' + config.policyServerHost + ':' + config.policyServerPort;
let BASE_URL = process.env.BASE_URL || defaultUrl;
const request = require('request');

const chai = require('chai');
const {expect} = chai;

/**
 run as a part of the main test suite or with
 BASE_URL=http://localhost:3000 mocha test/api/v1/module/report.js
 to run against a server running in as a separate process.
 */



//app id from the staging shaid server which it is assumed is used for testing.
//30ea6bce-91de-4b18-8b52-68d82112eee6	test phone number1	IOS	123
let testApp = {
    uuid: `30ea6bce-91de-4b18-8b52-68d82112eee6`
};

describe(`/api/v1/module/report tests`, function () {


    describe(`create and view report for application from policy update request`, function () {
        it(`/api/v1/production/policy POST`, function (done) {

            let now = Math.floor(Date.now());

            let id = 'now-' + now;

            let device_data = require('./device_data');

            let options = {
                method: 'POST',
                url: BASE_URL + '/api/v1/production/policy',
                headers:
                  { 'Content-Type': 'application/json' },
                body:
                  {
                      policy_table: {
                          module_config: {
                              full_app_id_supported: true,
                              exchange_after_x_days: 1,
                              exchange_after_x_ignition_cycles: 1,
                              exchange_after_x_kilometers: 1,

                          },
                          module_meta: {
                              //ignition based exchange.
                              ignition_cycles_since_last_exchange: 1,
                              // pt_exchanged_x_days_after_epoch: 0,
                              // pt_exchanged_at_odometer_x: 30
                          },
                          device_data,
                          app_policies: {},
                          consumer_friendly_messages: {},
                          functional_groupings: {},
                          usage_and_error_counts: {
                              app_level: {
                                  [testApp.uuid]: {
                                      count_of_TLS_errors: 0,
                                      count_of_user_selections: 1,
                                      count_of_rejected_rpc_calls: 2,
                                      minutes_in_hmi_background: 3,
                                      minutes_in_hmi_full: 4,
                                      minutes_in_hmi_limited: 5,
                                      minutes_in_hmi_none: 6
                                  }
                              }
                          }
                      },
                  },
                json: true
            }


            request(options,function(err,res,body) {
                // console.log(err,res.statusCode);

                expect(res.statusCode).to.be.equal(200);

                done();
            })

        })

        //report is generated asynchronously in the background after a response is give.
        //there is a chance we can request the application report before it has been generated
        //giving us an out of date response.
        it(`wait for report`, function(done) {
            setTimeout(done,1000);
        })


        it(`/api/v1/module/report GET`, function(done) {


            let options = {
                method: 'GET',
                url: BASE_URL + `/api/v1/module/report`,
                headers:
                  { 'Content-Type': 'application/json' }
            }


            request(options,function(err,res,body) {
                console.log(err,res.statusCode,body);

                expect(res.statusCode).to.be.equal(200);

                let {data,meta} = JSON.parse(body);

                console.log(JSON.stringify(data,null,' '));

                expect(data.report_days).not.to.be.undefined;
                expect(data.total_device_carrier).not.to.be.undefined;
                expect(data.total_device_model).not.to.be.undefined;
                expect(data.total_device_os).not.to.be.undefined;
                expect(data.policy_table_updates_by_trigger).not.to.be.undefined;
                expect(data.total_policy_table_updates_by_trigger).not.to.be.undefined;

                done();
            })
        })


    })
})
