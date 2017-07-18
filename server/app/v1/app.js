const async = require('async');
const sql = require('sql-bricks');
let express = require('express');

let app = express();
module.exports = app;

//get locals from the parent app
app.on("mount", function (parent){
    app.locals.config = parent.locals.config;
    app.locals.log = parent.locals.log;
    app.locals.db = parent.locals.db;
    app.locals.collectors = parent.locals.collectors;
});

app.get('/requests', function (req, res, next) {
    //use the data collectors to get application request data
    //SHAID should be the first module to run for this
    const iteratingCollectors = app.locals.collectors.map(function (module) {
        return module.getAppRequests; //use each module's getAppRequests function to get the new app requests
    });

    //invoke array of data collector functions
    async.waterfall(iteratingCollectors, function (err, appRequests) {
        //all app requests are now aggregated from all data collecting sources
        if (err) {
            app.locals.log.error(err);
        }
        //operate over every app request received
        //the reason this should be serial is that every app coming in has a chance to contain information
        //the policy server doesn't have. the server needs to do an update cycle when it notices information missing.
        //allowing parallel computation will cause duplicate cycles to run when multiple apps come in with missing information,
        //causing lots of unnecessary load on the SHAID server
        const requestTasks = appRequests.map(function (appRequest) {
            return evaluateAppRequest.bind(null, appRequest);
        });

        async.series(requestTasks, function (err) {
            if (err) {
                app.locals.log.error(err);
            }
        });
    });
    //TODO: temporary
    res.sendStatus(200);
});

function evaluateAppRequest (appObj, callback) {
    app.locals.log.info(JSON.stringify(appObj, null, 4));
    
    //TODO: wrap all of this in a parallel computation thing to parallelize it when possible, then wait for their callbacks
    //hmi level check

    const sqlStr = sql.select('*').from('hmi_levels').where({id: appObj.default_hmi_level}).toString();
    app.locals.db.sqlQuery(sqlStr, function (data) {
        if (data.rows.length === 0) {
            app.locals.log.info("HMI LEVEL not found in local database: " + appObj.default_hmi_level);
            //take further action
            updateHMILevels(callback);
        }
    });
    

    /*
        check the database everytime FIRST to see if the information given by the request is in the database
        check every component by default, calling the update functions when necessary if something is missing.
        THEN attempt to add the record to the database. if the insert fails, don't crash the server. log the error
        and inform the user that this record was unable to be inserted
        here's the info you gotta check everytime:

        countries
        categories
        HMI LEVEL
        Vehicle ID (permissions. might also need some RPCs included so expect a DB change here. probably do this last)

        for vendor ID, add a new record to the database every time and use that generated ID for the app request

    */
    callback();
}

//BEGIN UPDATER FUNCTIONS
function updateHMILevels () {

}

//END UPDATER FUNCTIONS


/* OLD CODE. FOR REFERENCE ONLY. DELETE SOON
function evaluateApplication (appObj) {
    app.locals.log.info(JSON.stringify(appObj, null, 4));
            
    const newAppObj = {
        app_uuid: appObj.uuid,
        name: appObj.name,
        vendor_id: appObj.vendor.id,
        platform: appObj.platform,
        platform_app_id: appObj.platform_app_id,
        status: appObj.status,
        can_background_alert: appObj.can_background_alert,
        can_steal_focus: appObj.can_steal_focus,
        default_hmi_level: 1,
        tech_email: appObj.tech_email,
        tech_phone: appObj.tech_phone,
        category_id: appObj.category.id
    }
    
    const sqlStr = sql.insert('app_info', newAppObj).toString();
    app.locals.db.sqlQuery(sqlStr, function (err, data) {
        if (err) { 
            //we are missing information! start querying the database for potential missing information
            async.parallel([
                function (callback) {
                    //check hmi levels

                }
            ], function (err, res) {

            });
        }
        console.log(data);
    });     
}

//ensure that the category id passed in is in the database
function checkCategoryId (appObj, next) {
    const categoryId = appObj.category.id;
    const sqlStr = sql.select('*').from('categories').where({id: categoryId}).toString();

    //check if the category is documented in the DB
    app.locals.db.sqlQuery(sqlStr, function (data) {
        if (data.rows.length === 0) {
            app.locals.log.info("Category not found in local database: " + appObj.category.display_name);
            //take further action
            updateCategories(next);
        }
    });  
}

function updateCategories (next) {
    getShaidCategories(function (categories) {
        storeCategories(categories, next);
    });
}

function getShaidCategories (callback) {
    //query the SHAID API and return an updated list of categories
    app.locals.shaid.read(app.locals.shaid.entity.category, {}, function (err, res) {
        callback(res.data.categories);
    });  
}

function storeCategories (categories, callback) {
    async.each(categories, checkInsert, function (err) {
        if (err) {
            app.locals.log.error(err);
        }
        callback(); //done
    });

    //add categories to the DB
    function checkInsert (category, callback) {
        const queryStr = sql.select('*').from('categories').where({id: category.id}).toString();
        app.locals.db.sqlQuery(queryStr, function (data) {
            if (data.rows.length === 0) { //category doesn't exist yet. add it
                const insertStr = sql.insertInto('categories', 'id', 'display_name').values(category.id, category.display_name).toString();
                app.locals.db.sqlQuery(insertStr, function (data) {
                    callback();
                });                 
            }
            else { //category exists
                callback();
            }
        });             
    }
}



//ensure that the category id passed in is in the database
function checkCountriesId (appObj, next) {
    const countries = appObj.countries;
    const sqlStr = sql.select('*').from('countries').where({id: countryId}).toString();

    //check if the country is documented in the DB
    app.locals.db.sqlQuery(sqlStr, function (data) {
        if (data.rows.length === 0) {
            app.locals.log.info("Country not found in local database: " + appObj.country.name);
            //take further action
            updateCountries(next);
        }
    });  
}

function updateCountries (next) {
    getShaidCountries(function (countries) {
        storeCountries(countries, next);
    });
}

function getShaidCountries (callback) {
    //query the SHAID API and return an updated list of categories
    app.locals.shaid.read(app.locals.shaid.entity.country, {}, function (err, res) {
        callback(res.data.countries);
    });  
}

function storeCountries (countries, callback) {
    async.each(countries, checkInsert, function (err) {
        if (err) {
            app.locals.log.error(err);
        }
        callback(); //done
    });

    //add countries to the DB
    function checkInsert (country, callback) {
        const queryStr = sql.select('*').from('countries').where({id: country.id}).toString();
        app.locals.db.sqlQuery(queryStr, function (data) {
            if (data.rows.length === 0) { //country doesn't exist yet. add it
                const insertStr = sql.insertInto('countries', 'id', 'iso', 'name').values(country.id, country.iso, country.display_name).toString();
                app.locals.db.sqlQuery(insertStr, function (data) {
                    callback();
                });                 
            }
            else { //country exists
                callback();
            }
        });             
    }
}

//calls back true if the given app isn't found or if the given app is newer than the one in the database
function shouldUpdateApp (appObj, callback) {
    //query to find apps with the same uuid
    const sqlStr = sql.select('*').from('app_info').where({app_uuid: appObj.uuid}).toString();
    app.locals.db.sqlQuery(sqlStr, function (data) {
        app.locals.log.info("uuids for " + appObj.uuid);
        app.locals.log.info(data.rows);
        if (data.rows.length === 0) {
            callback(true);
        }
        else {
            callback(true);
            //compare timestamps
        }
    });
}
*/