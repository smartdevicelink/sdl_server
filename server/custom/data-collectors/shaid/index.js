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
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of applications that come from SHAID
        getAppRequests: function (appRequests, next) { 
            //include group name or rpc/parameter for the group
            shaid.read(shaid.entity.application, {}, function (err, res) {
                next(err, appRequests.concat(res.data.applications));
            }); 
        },
        //do not handle
        getHmiLevels: function (hmiLevels, next) {
            next(null, hmiLevels);
        },
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid countries that come from SHAID
        getCountries: function (countries, next) {
            shaid.read(shaid.entity.country, {}, function (err, res) {
                next(err, countries.concat(res.data.countries));
            }); 
        },        
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid app categories that come from SHAID
        getCategories: function (categories, next) {
            shaid.read(shaid.entity.category, {}, function (err, res) {
                next(err, categories.concat(res.data.categories));
            }); 
        },
        //do not handle
        getPermissions: function (permissions, next) {
            next(null, permissions);
        },
        //DEPRECATED
        //do not handle
        getRpcPermissions: function (rpcPermissions, next) {
            next(null, rpcPermissions);
        },
        //DEPRECATED
        //do not handle
        getVehicleDataPermissions: function (vehicleDataPermissions, next) {
            next(null, vehicleDataPermissions);
        }
    };
}