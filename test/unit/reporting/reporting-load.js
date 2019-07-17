const moment = require('moment');



//must be run in the root directory.
const config = require('../../../settings'); //configuration module
const log = require(`../../../custom/loggers/${config.loggerModule}/index.js`);


console.log(`config`,config);
const db = require(`../../../custom/databases/${config.dbModule}/index.js`)(log); //pass in the logger module that's loaded
// const flame = require('../../lib/flame-box');
// const hashify = require('../../lib/hashify');
// const arrayify = require('../../lib/arrayify');
// const parcel = require('./helpers/parcel');
// const Cron = require('cron').CronJob;
const ReportingService = require('../../../lib/reporting/ReportingService');
const ReportingTestHelper = require('./utils/ReportingTestHelper');
const expect = require('chai').expect;

let rth;


/**@type {ReportingService} **/
let reportingService;


describe('update from policy table', () => {

  // before(function(done) {
  //   // this.timeout(30 * 1000);
  //   // done();
  //   // setTimeout(done, 15000);
  // });

  it('init services', async () => {
    reportingService = await ReportingService.create({db});
    rth = new ReportingTestHelper({reportingService});
  });



  if (false)
  {
    let count = 100;
    let concurrency = 10;
    // count = 1;
    // concurrency = 1;
    it('load testing 10 concurrent count 100', async function() {

      this.timeout(100 * 1000);
      await rth.sleep(1000 * 5);


      let result = await rth.sendConcurrentUpdates(count,concurrency);

      for (let concurrentGroup of result)
      {

        for (let result of concurrentGroup)
        {
          expect(result.success).to.be.true;
        }
      }

      // let result = await reportingService.updateReporting({
      //   device_data: {
      //     "old": { //device id from core
      //       "carrier": "",
      //       "connection_type": "BTMAC",
      //       "hardware": "Pixel",
      //       "os": "Android",
      //       "os_version": "8.1.0"
      //     },
      //   }
      // },
      //   moment().subtract(60,'days').toDate());
    })
  }




  it(`load testing 2`, async function() {

    this.timeout(100 * 1000);

    console.log(`start load testing 2`);
    await rth.sleep(1000 * 1)



    this.timeout(100 * 1000);


    let count = 100;
    let concurrency = 100;
    // count = 1;
    // concurrency = 100;

    let result = await rth.sendConcurrentUpdates(count,concurrency);

    for (let concurrentGroup of result)
    {

      for (let result of concurrentGroup)
      {
        expect(result.success).to.be.true;
      }
    }

    // let result = await reportingService.updateReporting({
    //   device_data: {
    //     "old": { //device id from core
    //       "carrier": "",
    //       "connection_type": "BTMAC",
    //       "hardware": "Pixel",
    //       "os": "Android",
    //       "os_version": "8.1.0"
    //     },
    //   }
    // },
    //   moment().subtract(60,'days').toDate());
  })


  it(`load testing 3`, async function() {

    // this.timeout(100 * 1000);
    this.timeout(0);

    console.log(`start load testing 3`);
    await rth.sleep(1000 * 1)



    this.timeout(100 * 1000);


    let count = Math.pow(10,4);
    let concurrency = 1;
    // count = 10;
    // concurrency = 100;

    let result = await rth.sendConcurrentUpdates(count,concurrency);

    for (let concurrentGroup of result)
    {

      for (let result of concurrentGroup)
      {
        expect(result.success).to.be.true;
      }
    }

    // let result = await reportingService.updateReporting({
    //   device_data: {
    //     "old": { //device id from core
    //       "carrier": "",
    //       "connection_type": "BTMAC",
    //       "hardware": "Pixel",
    //       "os": "Android",
    //       "os_version": "8.1.0"
    //     },
    //   }
    // },
    //   moment().subtract(60,'days').toDate());
  })


  it(`load testing 3`, async function() {

    // this.timeout(100 * 1000);
    this.timeout(0);

    console.log(`start load testing 3`);
    await rth.sleep(1000 * 1)



    this.timeout(100 * 1000);


    let count = Math.pow(10,6);
    let concurrency = 1;
    // count = 10;
    // concurrency = 100;

    let result = await rth.sendConcurrentUpdates(count,concurrency);

    for (let concurrentGroup of result)
    {

      for (let result of concurrentGroup)
      {
        expect(result.success).to.be.true;
      }
    }

    // let result = await reportingService.updateReporting({
    //   device_data: {
    //     "old": { //device id from core
    //       "carrier": "",
    //       "connection_type": "BTMAC",
    //       "hardware": "Pixel",
    //       "os": "Android",
    //       "os_version": "8.1.0"
    //     },
    //   }
    // },
    //   moment().subtract(60,'days').toDate());
  })







  it('exit connections', async() => {
    await db.end();
    // process.exit(0);
  })

})
