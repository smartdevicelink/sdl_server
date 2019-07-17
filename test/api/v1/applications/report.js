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
BASE_URL=http://localhost:3000 mocha test/api/v1/applications/report.js
to run against a server running in as a separate process.
 */



//app id from the staging shaid server which it is assumed is used for testing.
//30ea6bce-91de-4b18-8b52-68d82112eee6	test phone number1	IOS	123
let testApp = {
    uuid: `30ea6bce-91de-4b18-8b52-68d82112eee6`
}

describe(`/api/v1/applications/report tests`, function () {

    describe('get test app full info', function() {
        it(`/api/v1/applications/report GET`, function(done) {


            let options = {
                method: 'GET',
                url: BASE_URL + `/api/v1/applications?uuid=${testApp.uuid}`,
                headers:
                  { 'Content-Type': 'application/json' }
            }


            request(options,function(err,res,body) {
                console.log(err,res.statusCode,body);

                expect(res.statusCode).to.be.equal(200);

                let {data,meta} = JSON.parse(body);

                expect(data.applications).not.to.be.undefined;
                expect(data.applications.length).to.be.equal(1);

                testApp = data.applications[0];

                done();
            })
        })

    })

    describe(`create and view report for application from policy update request`, function () {
        it(`/api/v1/production/policy POST`, function (done) {

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
                          },
                          module_meta: {
                              //day based exchange.
                              exchange_after_x_ignition_cycles: 0,
                              pt_exchanged_x_days_after_epoch: 0,
                              // pt_exchanged_at_odometer_x: 30
                          },
                          app_policies: {},
                          consumer_friendly_messages: {},
                          device_data: {},
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


        it(`/api/v1/applications/report GET`, function(done) {


            let options = {
                method: 'GET',
                url: BASE_URL + `/api/v1/applications/report?id=${testApp.id}`,
                headers:
                  { 'Content-Type': 'application/json' }
            }


            request(options,function(err,res,body) {
                console.log(err,res.statusCode,body);

                expect(res.statusCode).to.be.equal(200);

                let {data,meta} = JSON.parse(body);

                console.log(JSON.stringify(data,null,' '));

                expect(data.application).not.to.be.undefined;
                expect(data.report_days).not.to.be.undefined;
                expect(data.usage_time_history).not.to.be.undefined;
                expect(data.user_selection_history).not.to.be.undefined;
                expect(data.rejected_rpcs_history).not.to.be.undefined;

                done();
            })
        })


    })
})

// common.post(
//   'should report for application',
//   '/api/v1/production/policy',
//   {
//       policy_table: {
//           module_config: {
//               full_app_id_supported: true,
//               app_policies: {
//
//               },
//               consumer_friendly_messages: {
//
//               },
//               device_data: {
//
//               },
//               functional_groupings: {
//
//               },
//               usage_and_error_counts: {
//                   app_level: {
//                       "4b5145c5-0970-4a42-ba4b-08a9ff47aea3": {
//                           count_of_TLS_errors: 0,
//                           count_of_user_selections: 1,
//                           count_of_rejected_rpc_calls: 2,
//                           minutes_in_hmi_background: 3,
//                           minutes_in_hmi_full: 4,
//                           minutes_in_hmi_limited: 5,
//                           minutes_in_hmi_none: 6
//                       }
//                   }
//               }
//           }
//       },
//       usage_and_error_counts: {
//           app_level
//       }
//   },
//   (err, res, done) => {
//       expect(err).to.be.null;
//       expect(res).to.have.status(200);
//       //expect(res.body.data.applications).to.have.lengthOf.above(0);
//       done();
//   }
// );
//
// common.get(
//     'should report for application',
//     endpoint,
//     {uuid: '4b5145c5-0970-4a42-ba4b-08a9ff47aea3'},
//     (err, res, done) => {
//         console.log(res)
//         expect(err).to.be.null;
//         expect(res).to.have.status(200);
//         //expect(res.body.data.applications).to.have.lengthOf.above(0);
//         done();
//     }
// );
