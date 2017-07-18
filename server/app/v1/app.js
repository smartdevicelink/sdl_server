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
    //appObj needs to be an array
    performUpdateCycle([appObj], 'hmi_levels', 'id', 'default_hmi_level', 'getHmiLevels', function (obj) {
        app.locals.log.info("HMI level not found in local database: " + obj.default_hmi_level);
    }, function (hmiLevel) {
        return {
            id: hmiLevel
        };
    }, function () {
        //done!
    });

    //countries check
    performUpdateCycle(appObj.countries, 'countries', 'id', 'id', 'getCountries', function (country) {
        app.locals.log.info("Country ID not found in local database: " + country.id);
    }, function (country) {
        return {
            id: country.id,
            iso: country.iso,
            name: country.name
        };
    }, function () {
        //done!
    });

    //categories check
    //appObj.category needs to be an array
    performUpdateCycle([appObj.category], 'categories', 'id', 'id', 'getCategories', function (category) {
        app.locals.log.info("Category ID not found in local database: " + category.id);
    }, function (category) {
        return {
            id: category.id,
            display_name: category.display_name
        };
    }, function () {
        //done!
    });    

    //permissions check
    /*
    TODO: are we gonna transform the data returned from the SHAID API into the permissions array?

    performUpdateCycle([appObj.permissions], 'app_permissions', 'app_id', 'id', 'getPermissions', function (category) {
        app.locals.log.info("Category ID not found in local database: " + category.id);
    }, function (category) {
        return {
            id: category.id,
            display_name: category.display_name
        };
    }, function () {
        //done!
    }); 
    */

    /*
        if the insert fails, don't crash the server. log the error
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

//master function that executes a full check and update cycle for a given set of information
function performUpdateCycle (dataArray, tableName, databasePropName, dataPropName, moduleFunction, errorCallback, dataTransform, callback) {
    const dataChecker = databaseChecker(dataArray, tableName, databasePropName, dataPropName);

    //see if any of the data received has information the policy server doesn't recognize
    async.parallel(dataChecker, function (obj) {
        if (obj) { //missing information
            errorCallback(obj);
            //get updated information from collector modules
            collectData(moduleFunction, function (dataArray) {
                //attempt an insert into the database for each piece of datum received
                async.each(dataArray, setupAddDataToDatabase(tableName, databasePropName, dataPropName, dataTransform), function (err) {
                    if (err) {
                        app.locals.log.error(err);
                    }
                    callback(); //done
                });
            });
        }
        else { //nothing wrong here!
            callback();
        }
    });
}

//given an array of values and some information to compare those values to a database,
//returns an array of functions to determine if all the values in the array exist in the database
//meant to be fed into async.parallel
function databaseChecker (dataArray, tableName, databasePropName, dataPropName) {
    return dataArray.map(function (datum) {
        return function (callback) {
            databaseQueryExists(tableName, databasePropName, datum[dataPropName], function (exists) {
                if (exists) {
                    callback();
                }
                else {
                    //pass in the object whose data wasn't there.
                    //if passed into async.parallel or a similar function, this will be considered an error
                    //and will stop the functions in this map from continuing to run
                    callback(datum);
                }
            });       
        };
    });
}

function collectData (moduleFunction, callback) {
    //cycle through all the collector modules to retrieve updated info using an implemented function
    const iteratingCollectors = app.locals.collectors.map(function (module) {
        return module[moduleFunction];
    });     

    //invoke array of data collector functions
    async.waterfall(iteratingCollectors, function (err, dataArray) {
        //all data are now aggregated from all data collecting sources
        if (err) {
            app.locals.log.error(err);
        }
        callback(dataArray);
    });     
}

//given some information about where to look for and insert new data, returns a function
//that can be fed into async.each in order to easily add new data to the database
function setupAddDataToDatabase (tableName, databasePropName, dataPropName, dataTransform) {
    return function (datum, callback) {
        //check that the datum hasn't been added already first
        databaseQueryExists(tableName, databasePropName, datum[dataPropName], function (exists) {
            if (exists) {
                callback();
            }
            else {
                //use the dataTransform function to transform the datum into an object that can 
                //be inserted into the database
                const insertStr = sql.insertInto(tableName, dataTransform(datum)).toString();
                app.locals.db.sqlCommand(insertStr, function (err, data) {
                    callback(err);
                }); 
            }
        });      
    }
}

//utility function. given a table name, a property to query and the value of the query,
//check whether that data exists in the database
function databaseQueryExists (tableName, databasePropName, dataPropValue, callback) {
    let propQuery = {};
    propQuery[databasePropName] = dataPropValue;
    const sqlStr = sql.select('*').from(tableName).where(propQuery).toString();     
    app.locals.db.sqlCommand(sqlStr, function (err, result) {
        if (result.rows.length === 0) { //the data doesn't exist in the DB
            callback(false);
        }
        else { //the data exists in the DB
            callback(true);
        }
    });
}

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
    app.locals.db.sqlCommand(sqlStr, function (err, data) {
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

*/