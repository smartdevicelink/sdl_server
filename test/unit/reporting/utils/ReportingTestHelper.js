
const moment = require('moment');

class ReportingTestHelper
{


  constructor(opts)
  {
    this.reportingService = opts.reportingService;
  }

  getRandomInt(min,max)
  {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  async getTestHardware()
  {
    return ReportingTestHelper.testHardware[this.getRandomInt(0,ReportingTestHelper.testHardware.length - 1)];
  }


  /**
   * can be multiple devices,
   * @returns {Promise<{old: {carrier: string, connection_type: string, os: string, os_version: string, hardware: string}}>}
   */
  async getTestDevice()
  {

    let device_data = {

    };

    let deviceIndex = this.getRandomInt(0,ReportingTestHelper.testDevices.length - 1);
    let device = ReportingTestHelper.testDevices[deviceIndex];

    // console.log(`got device`,device,`at index`,deviceIndex);

    //collisions will happen and there will be updates
    // let now = Math.floor(Date.now() / 100);
    let now = Math.floor(Date.now());

    let id = 'now-' + now;
    // device_data[id] = id;

    device_data[id] = device;
    return device_data;

    // return {
    //   "old": { //device id from core
    //     "carrier": "",
    //     "connection_type": "BTMAC",
    //     "hardware": hardware,
    //     "os": "Android",
    //     "os_version": "8.1.0"
    //   },
    // };

  }



  async sendPolicyTableUpdate()
  {
    let policyUpdate = {};

    // console.log(`sendPolicyTableUpdate`,policyUpdate);

    let device_data = await this.getTestDevice();


    let result = await this.reportingService.updateReporting({
        device_data
      },
      // moment().subtract(60,'days').toDate()
    );

    // console.log(`sendPolicyTableUpdate`,result);

    return result;


  }

  async sleep(timeout)
  {
    return new Promise((r) => setTimeout(r,timeout));
  }

  //send multiple updates with timeout randomized between 0 to .5 seconds
  async sendMultipleUpdates(count)
  {

    let results = [];
    while(count > 0)
    {
      console.log(`sendMultipleUpdates`,count);
      let result = await this.sendPolicyTableUpdate();
      results.push(result);
      // let timeout = Math.floor(Math.random() * 500);
      // await this.sleep(timeout);
      count--;
    }

    return results;


  }



  //send concurrent updates with timeout randomized between 0 to .5 seconds
  async sendConcurrentUpdates(count,concurrency)
  {

    return this.doConcurrentCalls(count,concurrency,this.sendMultipleUpdates);

  }


  async doConcurrentCalls(count,concurrency,func)
  {

    func = func.bind(this);


    let promiseArray = [];
    for (let i =0; i < concurrency; i++)
    {
      promiseArray.push(func(count));
    }

    let results = await Promise.all(promiseArray);

    // console.log(`doConcurrentCalls`,results);

    return results;
  }


}


ReportingTestHelper.testDevices = [
  {
    "carrier": "AT&T",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  {
    "carrier": "",
    "connection_type": "BTMAC",
    "hardware": "Nexus 7",
    "os": "Android",
    "os_version": "8.1.0"
  },
  {
    "carrier": "",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  {
    "carrier": "",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  {
    "carrier": "Verison",
    "connection_type": "BTMAC",
    "hardware": "iPhone 8",
    "os": "iOS",
    "os_version": "8.1.0"
  },
  {
    "carrier": "TING",
    "connection_type": "BTMAC",
    "hardware": "Nexus 7",
    "os": "Android",
    "os_version": "8.1.0"
  },
  {
    "carrier": "",
    "connection_type": "BTMAC",
    "hardware": "Nexus 7",
    "os": "Android",
    "os_version": "8.1.0"
  },
]



ReportingTestHelper.testHardware = [
  "iPhone 8",
  "Nexus 7",
  "unknown",
  "Nexus 1",
  "Nexus 2",
  "Nexus 3",
  "Nexus 4",
  "Nexus 5",
  "Nexus 6",
  "Liquid Zest",
  "Liquid Jade Z",
  "Liquid Jade X",
  // "Small 1",
  // "Small 2",
  // "Small 3",
  // "Small 4",
  // "Small 5",
  // "Small 6",
  // "Small 7",
  // "Small 8",
  // "Small 9",
  // "Small 10",
];


module.exports = ReportingTestHelper;
