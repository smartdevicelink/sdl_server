const request = require('request');
const shaidkit = require('shaidkit');
const config = require('../../settings.js');
const utils = require('./utils.js');

//initialize shaidkit
let shaidInitObj = {
    "version": 2,
    "public_key": config.shaidPublicKey,
    "secret_key": config.shaidSecretKey
};

//custom SHAID url option
if (process.env.SHAID_URL) {
    shaidInitObj.base_url = process.env.SHAID_URL;
}

const shaid = new shaidkit(shaidInitObj);

const self = module.exports = {
    webhook: function (req, res, next) {
        console.log("1");
        console.log(req.body);
        if (req.body.entity === "application") {
            const query = {
                uuid: req.body.uuid
            };
            const applicationFlow = req.app.locals.flow([self.getApplications.bind(null, query), storeApps(req)], {method: "waterfall"});
            applicationFlow(function (err, results) {
                console.log("yey");
                console.log(err);
                console.log(results);
                if (err) {
                    req.app.locals.log.error(err);
                }
                res.sendStatus(200);
            });
        }
        else {
            //request contained an entity the server cannot handle
            res.sendStatus(500);
        }  
    },
    getCountries: function (queryObj, next) {
        shaid.read(shaid.entity.country, queryObj, function (err, res) {
            next(err, res.data.countries);
        }); 
    },        
    getCategories: function (queryObj, next) {
        shaid.read(shaid.entity.category, queryObj, function (err, res) {
            next(err, res.data.categories);
        }); 
    },
    getApplications: function (queryObj, next) {
        shaid.read(shaid.entity.application, queryObj, function (err, res) {
            next(err, res.data.applications);
        }); 
    }
};

//TODO: remove this
const TEMP_APPS = [{
    "uuid": "9bb1d9c2-5d4c-457f-9d91-86a2f95132df",
    "name": "Two App",
    "display_names": [
        "App Two",
        "Application Two"
    ],
    "platform": "ANDROID",
    "platform_app_id": "com.demo.app.two",
    "status": "DEVELOPMENT",
    "can_background_alert": true,
    "can_steal_focus": true,
    "tech_email": null,
    "tech_phone": null,
    "default_hmi_level": "HMI_NONE",
    "created_ts": "2017-06-12T13:30:32.912Z",
    "updated_ts": "2017-08-02T19:28:32.912Z",
    "countries": [
        {
            "id": 1,
            "iso": "AD",
            "name": "Andorra"
        },
        {
            "id": 2,
            "iso": "AE",
            "name": "United Arab Emirates"
        }
    ],
    "permissions": [
        {
            "id": 18,
            "key": "accPedalPosition",
            "name": "Accelerator Pedal Position",
            "hmi_level": "HMI_FULL",
            "is_parameter": true,
        },
        {
            "id": 20,
            "key": "driverBraking",
            "name": "Braking",
            "hmi_level": "HMI_BACKGROUND",
            "is_parameter": true
        }
    ],
    "category": {
        "id": 1,
        "name": "DEFAULT",
        "display_name": "Default"
    },
    "vendor": {
        "id": 1,
        "name": "Livio Web Team",
        "email": "admin@example.com"
    }
},
{
    "uuid": "ab9eec11-5fd1-4255-b4cd-769b529c88c4",
    "name": "idle_clicker",
    "display_names": [
        "Idle Clicker Android",
        "Idle Clicker"
    ],
    "platform": "ANDROID",
    "platform_app_id": "com.android.idle.clicker",
    "status": "PRODUCTION",
    "can_background_alert": true,
    "can_steal_focus": true,
    "tech_email": null,
    "tech_phone": null,
    "default_hmi_level": "HMI_NONE",
    "created_ts": "2017-06-12T13:34:33.514Z",
    "updated_ts": "2017-06-12T14:23:37.817Z",
    "countries": [
        {
            "id": 77,
            "iso": "GB",
            "name": "United Kingdom"
        },
        {
            "id": 233,
            "iso": "US",
            "name": "United States"
        }
    ],
    "permissions": [
        {
            "id": 25,
            "key": "airbagStatus",
            "name": "Airbag Status",
            "hmi_level": "HMI_BACKGROUND",
            "is_parameter": true
        }
    ],
    "category": {
        "id": 2,
        "name": "COMMUNICATION",
        "display_name": "Communication"
    },
    "vendor": {
        "id": 1,
        "name": "Livio Web Team",
        "email": "admin@example.com"
    }
}];

//TODO: REMOVE THIS
const g = {
    app: {
        locals: {
            flow: require('../flow'),
            log: require('../../custom/loggers/winston')
        }
    }
};
storeApps(g)([], function(){});

//send req to gain access to submitting SQL queries
//a whole flow dedicated to storing applications from SHAID
function storeApps (req) {
    const flow = req.app.locals.flow;
    const log = req.app.locals.log;

    return function (apps, next) {
        console.log("2");
        console.log(apps);
        //fake apps coming from SHAID for now
        //apps = TEMP_APPS;
        //setup a function for each app to store them all in the database
        //first check if the apps need to be stored in the database
        const updateCheckFlow = flow(utils.checkNeedsInsertionArray(apps), {method: "parallel"});
        const fullFlow = flow([updateCheckFlow, utils.filterApps, utils.insertApps], {method: "waterfall"});

        fullFlow(function (err, res) {
            if (err) {
                log.error(err);
            }
            next();
        });
    }
}

