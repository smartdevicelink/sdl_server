const request = require('request');
const shaidkit = require('shaidkit');
const config = require('../../../settings.js');
const package = require('../../../package.json');
const app = require('../app');

//a constant that informs the policy server the maximum number of apps returned at once from SHAID
const MAX_APPLICATION_QUERY = 50;
//initialize shaidkit
let shaidInitObj = {
    "version": 2,
    "public_key": config.shaidPublicKey,
    "secret_key": config.shaidSecretKey,
    "sdl_server_version": package.version || null
};

//custom SHAID url option
if (process.env.SHAID_URL) {
    shaidInitObj.base_url = process.env.SHAID_URL;
}
const shaid = new shaidkit(shaidInitObj);

const self = module.exports = {
    getCountries: function (queryObj) {
        return new Promise(resolve => {
            shaid.read(shaid.entity.country, queryObj, function (err, res) {
                resolve(res.data.countries);
            });
        });
    },
    getCategories: function (queryObj) {
        return new Promise(resolve => {
            shaid.read(shaid.entity.category, queryObj, function (err, res) {
                resolve(res.data.categories);
            });
        });
    },
    setApplicationApprovalVendor: function (applications) {
        if (!Array.isArray(applications)) {
            applications = [applications];
        }

        return new Promise(resolve => {
            shaid.update(
                shaid.entity["application/approval/vendor"],
                {
                    "applications": applications
                },
                function (err, res) {
                    resolve(null);
                }
            );
        });
    },
    getApplications: function (queryObj) {
        //enforce limits if they do not already exist
        let enforcedLimit;
        if (queryObj.limit !== undefined && queryObj.limit <= MAX_APPLICATION_QUERY) {
            enforcedLimit = queryObj.limit;
        }
        else {
            queryObj.limit = MAX_APPLICATION_QUERY;
            enforcedLimit = MAX_APPLICATION_QUERY;
        }

        let apps = []; //the total apps when readRecurse finishes

        return new Promise(resolve => {
            readRecurse();
            function readRecurse () {
                //read the applications
                shaid.read(shaid.entity.application, queryObj, function (err, res) {
                    const appsInQuery = res.data.applications;
                    apps = apps.concat(appsInQuery); //add to the total apps found

                    if (appsInQuery.length === enforcedLimit) {
                        //got max apps back. this could mean there are more we need to get
                        if (queryObj.offset === undefined) {
                            queryObj.offset = 0;
                        }
                        queryObj.offset += enforcedLimit; //increase the offset
                        readRecurse();
                    }
                    else { //got all the rest of the apps back
                        resolve(apps);
                    }
                });
            }
        });
    },
    getPermissions: function (queryObj) {
        return new Promise(resolve => {
            shaid.read(shaid.entity.permission, queryObj, function (err, res) {
                //parse through the first array of objects and extract just the permissions
                let permissions = [];

                res.data.permission_categories.forEach(permissionBlock => {
                    for (let j = 0; j < permissionBlock.permissions.length; j++) {
                        permissions.push(permissionBlock.permissions[j]);
                    }
                });
                resolve(permissions);
            });
        });
    },
    getServices: function(queryObj) {
        return new Promise(resolve => {
            shaid.read(
                shaid.entity.service,
                queryObj,
                function (err, res) {
                    resolve(res.data.services);
                }
            );
        });
    }
};
