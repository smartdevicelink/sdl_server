const shaidkit = require('shaidkit');
const config = require('../../../config.js');

//initialize the shaid kit
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

module.exports = function (log) {
    //exported functions. these are required to implement
    return {
        //only a "next" parameter here because this should be the first module called
        getAppRequests: function (next) {
            shaid.read(shaid.entity.application, {}, function (err, res) {
                next(err, res.data.applications);
            }); 
        },
        getHmiLevels: function (next) {
            //there's currently no external resource for getting HMI levels
            let hmiLevels = [
                "HMI_NONE",
                "HMI_BACKGROUND",
                "HMI_LIMITED",
                "HMI_FULL"
            ];
            next(null, hmiLevels);
        },
        getCountries: function (next) {
            shaid.read(shaid.entity.country, {}, function (err, res) {
                next(err, res.data.countries);
            }); 
        },        
        getCategories: function (next) {
            shaid.read(shaid.entity.category, {}, function (err, res) {
                next(err, res.data.categories);
            }); 
        },
        getPermissions: function (next) {
            next(null, []);
        }        
    };
}