const request = require('request');
const shaidkit = require('shaidkit');
const config = require('../../settings.js');

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

module.exports = {
    webhook: function (req, res, next) {
        console.log("1");
        console.log(req.body);
        if (req.body.entity === "application") {
            const applicationFlow = req.app.locals.flow([getApplications(req), checkResponse, storeApps]);
            applicationFlow(function (err, results) {
                if (err) { //something failed
                    res.sendStatus(500);
                    return req.app.locals.log.error(err);
                }
                //success
                res.sendStatus(500); //TODO: change to 200
            });
        }        
        next();
    }
};

function getApplications (req) {
    return function (next) {
        request({
            "method": "GET",
            "uri": process.env.SHAID_URL + "api/v2/application?uuid=" + req.body.uuid,
            "headers": {
                "Content-Type": "application/json",
                "public_key": process.env.SHAID_PUBLIC_KEY,
                "secret_key": process.env.SHAID_SECRET_KEY
            }
        }, next); //error is first argument, so error handling is already set up
    }
}

function checkResponse (res, body, next) {
    console.log("2");
    console.log(JSON.parse(body));

    if (res.statusCode >= 200 && res.statusCode < 300) {
        //should have applications here now
        let apps = JSON.parse(body).data.applications;
        next(null, apps);
    } 
    else {
        //not successful status code. log the meta property for more info
        next(JSON.parse(body).meta);
    }
}

//use the sql lib to help store app information from the data received
function storeApps (apps, next) {
    console.log("3");
    console.log(apps);
    next();
}

/*
app.route('/request')
    .post(webhook)

function webhook(req, res, next){
    console.log('webhook received')
    //make request to shaid here
    if(req.body.entity === "application"){
        request({
            "method": "GET",
            "uri": process.env.SHAID_URL + "api/v2/application?uuid=" + req.body.uuid,
            "timeout": 10000,
            "headers":{
                "Content-Type": "application/json",
                "public_key": process.env.SHAID_PUBLIC_KEY,
                "secret_key": process.env.SHAID_SECRET_KEY
            }
        }, function(err, response, body){
            if(err){
                console.log("Network Error", err)
            }else if(response.statusCode >= 200 && response.statusCode < 300){

                let apps = JSON.parse(body).data.applications;
                apps.map(function(newApp){
                    app.locals.db.sqlCommand(sql.insert('app_info', {
                        "app_uuid": newApp.uuid,
                        "name": newApp.name,
                        "vendor_id": newApp.vendor.id,
                        "platform": newApp.platform,
                        "plaform_app_id": newApp.plaform_app_id,
                        "status": newApp.status,
                        "can_background_alert": newApp.can_background_alert,
                        "can_steal_focus": newApp.can_steal_focus,
                        "default_hmi_level": newApp.default_hmi_level,
                        "tech_email": newApp.tech_email,
                        "tech_phone": newApp.tech_phone,
                        "created_ts": newApp.created_ts,
                        "updated_ts": newApp. updated_ts,
                        "category_id": newApp.category.id,
                        "approval_status": newApp.approval_status
                    }), function(err, res){
                        if(err){
                            console.error(err)
                        } else {
                            console.log('app info added')
                        }
                    })
                })
                res.sendStatus(response.statusCode);

            }else if(response.statusCode >= 400 && response.statusCode <= 403){
                console.log(response.statusCode, body);
            }else{
                console.log(body);
            }
        })
    }
}
*/
/*
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
*/