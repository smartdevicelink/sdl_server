const request = require('request');
const shaidkit = require('shaidkit');
const config = require('../../../settings.js');
const utils = require('./utils.js');
//a constant that informs the policy server the maximum number of apps returned at once from SHAID
const MAX_APPLICATION_QUERY = 50; 
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
        if (req.body.entity === "application") {
            const query = {
                uuid: req.body.uuid
            };
            queryAndStoreApplications(query, function () {
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
    },
    getPermissions: function (queryObj, next) {
        shaid.read(shaid.entity.permission, queryObj, function (err, res) {
            //parse through the first array of objects and extract just the permissions
            let permissions = [];
            for (let i = 0; i < res.data.permission_categories.length; i++) {
                const permissionBlock = res.data.permission_categories[i];
                for (let j = 0; j < permissionBlock.permissions.length; j++) {
                    permissions.push(permissionBlock.permissions[j]);
                }
            }
            next(err, permissions);
        });
    },
    queryAndStorePermissions: function (queryObj, next) {
        const permissionFlow = utils.flow([self.getPermissions.bind(null, queryObj), utils.storePermissions], {method: "waterfall"});
        permissionFlow(function (err, res) {
            next(err);
        });          
    },
    queryAndStoreApplications: function (queryObj, next) {
        //enforce limits if they do not already exist
        let enforcedLimit;
        if (queryObj.limit !== undefined && queryObj.limit <= MAX_APPLICATION_QUERY) {
            enforcedLimit = queryObj.limit;
        }
        else {
            queryObj.limit = MAX_APPLICATION_QUERY;
            enforcedLimit = MAX_APPLICATION_QUERY;
        }

        const applicationFlow = utils.flow([self.getApplications.bind(null, queryObj), utils.storeApps(false)], {method: "waterfall"});
        applicationFlow(function (err, appCount) {
            if (appCount === enforcedLimit) { 
                //got max apps back. this could mean there are more we need to get
                if (queryObj.offset === undefined) {
                    queryObj.offset = 0;
                }
                queryObj.offset += enforcedLimit; //increase the offset
                self.queryAndStoreApplications(queryObj, next);
            } 
            else { //got all the rest of the apps back
                next();
            }
        });        
    },
    storeApps: utils.storeApps //expose this utility function, as it is really useful
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
    "status": "PRODUCTION",
    "can_background_alert": false,
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
        },
        {
            "id": 240,
            "key": "CLIMATE",
            "name": "CLIMATE",
            "hmi_level": "HMI_BACKGROUND",
            "is_parameter": true
        },
        {
            "id": 66666,
            "key": "speed",
            "name": "Speed",
            "hmi_level": "HMI_NONE",
            "is_parameter": true
        },
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


utils.storeApps(false)(TEMP_APPS, function () {});