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

//a request came from sdl_core!
app.post('/policy', function (req, res, next) {
    //given an app id, generate a policy table based on the permissions granted to it

    //iterate over the app_policies object. for each ID found, 
});

function evaluateAppRequest (appObj, callback) {
    app.locals.log.info(JSON.stringify(appObj, null, 4));
    
    //TODO: for vendor ID, add a new record to the database every time and use that generated ID for the app request
    //TODO: test if adding a vin to on/sub/unsub vehicle data will crash things.
    //TODO: use map() and pass back only one updated value at a time instead of array. we don't need checkProp as distinction
    //TODO: change when SHAID changes its output to distinguish between different permissions
    let rpcPermissions = [];
    let vehicleDataPermissions = [];
    for (let i = 0; i < appObj.permissions.length; i++) {
        const perm = appObj.permissions[i];
        if (perm.key.charAt(0).toLowerCase() === perm.key.charAt(0)) { //first letter is lowercase
            vehicleDataPermissions.push(perm.key);
        }
        else { //first letter is uppercase
            rpcPermissions.push(perm.key);
        }
    }

    async.parallel([
        function (callback) {
            //hmi level check
            performUpdateCycle([appObj.default_hmi_level], 'hmi_levels', 'id', 'getHmiLevels', function (hmiLevel) {
                app.locals.log.info("HMI level not found in database." + hmiLevel);  
            }, function (updatedHmiLevels, next) {
                app.locals.log.info("Received HMI level updates");  
                const newHmiLevels = updatedHmiLevels.map(function (hmiLevel) {
                    return {
                        id: hmiLevel
                    };
                });
                next(newHmiLevels, 'id');
            }, function () {
                callback();
            });
        },
        function (callback) {
            //countries check
            const countryValuesArray = appObj.countries.map(function (country) {
                return country.id;
            });
            performUpdateCycle(countryValuesArray, 'countries', 'id', 'getCountries', function (countryId) {
                app.locals.log.info("Country ID not found in local database: " + countryId);
            }, function (updatedCountries, next) {
                app.locals.log.info("Received country updates");
                const newCountries = updatedCountries.map(function (country) {
                    return { 
                        id: country.id,
                        iso: country.iso,
                        name: country.name
                    };
                });
                next(newCountries, 'id');
            }, function () {
                callback();
            });
        },
        function (callback) {
            //categories check
            performUpdateCycle([appObj.category.id], 'categories', 'id', 'getCategories', function (categoryId) {
                app.locals.log.info("Category ID not found in local database: " + categoryId);
            }, function (updatedCategories, next) {
                app.locals.log.info("Received category updates");
                const newCategories = updatedCategories.map(function (category) {
                    return {
                        id: category.id,
                        display_name: category.display_name
                    };
                });
                next(newCategories, 'id');
            }, function () {
                callback();
            });
        },
        function (callback) {
            //rpc permissions check
            performUpdateCycle(rpcPermissions, 'rpc_names', 'rpc_name', 'getRpcPermissions', function (permissionName) {
                app.locals.log.info("RPC permission not found in local database: " + permissionName);
            }, function (updatedPermissions, next) {
                app.locals.log.info("Received RPC permission updates");
                const newPermissions = updatedPermissions.map(function (permission) {
                    return {
                        rpc_name: permission
                    };
                });
                next(newPermissions, 'rpc_name');
            }, function () {
                callback();
            });
        },
        function (callback) {
            //vehicle data permissions check
            performUpdateCycle(vehicleDataPermissions, 'vehicle_data', 'component_name', 'getVehicleDataPermissions', function (permissionName) {
                app.locals.log.info("Vehicle data permission not found in local database: " + permissionName);
            }, function (updatedPermissions, next) {
                app.locals.log.info("Received vehicle data permission updates");
                const newPermissions = updatedPermissions.map(function (permission) {
                    return {
                        component_name: permission
                    };
                });
                next(newPermissions, 'component_name');
            }, function () {
                callback();
            });
        },
    ], function (err) {
        //database is updated. attempt the insert now
        //insert the vendor information first
        const vendor = {
            vendor_name: appObj.vendor.name,
            vendor_email: appObj.vendor.email
        };
        const newAppObj = {
            app_uuid: appObj.uuid,
            name: appObj.name,
            vendor_id: appObj.vendor.id,
            platform: appObj.platform,
            platform_app_id: appObj.platform_app_id,
            status: appObj.status,
            can_background_alert: appObj.can_background_alert,
            can_steal_focus: appObj.can_steal_focus,
            default_hmi_level: appObj.default_hmi_level,
            tech_email: appObj.tech_email,
            tech_phone: appObj.tech_phone,
            category_id: appObj.category.id
        };

        const vendorInsertStr = sql.insert('vendors', vendor).toString();
        const appInsertStr = sql.insert('app_info', newAppObj).toString();

        app.locals.db.sqlCommand(vendorInsertStr, function (err, data) {
            if (err) { 
                app.locals.log.error(err);
            }
            app.locals.db.sqlCommand(appInsertStr, function (err, data) {
                if (err) { 
                    //we are still missing information! there's nothing else that can be done
                    app.locals.log.error("App information insert failed!");
                    app.locals.log.error(JSON.stringify(newAppObj, null, 4));
                    app.locals.log.error(err);
                }
                callback();
            });
        });

    });
}

//master function that executes a full check and update cycle for a given set of information
function performUpdateCycle (dataArray, tableName, databasePropName, moduleFuncName, errorCallback, transformDataFunc, callback) {
    const dataChecker = dataArray.map(function (datum) {
        return function (next) {
            databaseQueryExists(tableName, databasePropName, datum, function (exists) {
                if (exists) {
                    next();
                }
                else {
                    //value doesn't exist in DB. end the other checks by passing the datum that was missing
                    next(datum);
                }
            });       
        };
    });

    //see if any of the data received has information the policy server doesn't recognize
    async.parallel(dataChecker, function (datum) {
        if (datum) { //missing information
            errorCallback(datum); //let the caller know which data is missing
            //get updated information from collector modules
            collectData(moduleFuncName, function (updatedDataArray) {
                //send this info back to the caller so the caller can transform the data as they please
                transformDataFunc(updatedDataArray, insertData);
            });
        }
        else { //nothing missing!
            callback();
        }
    });

    //stage two: uses the updated data array and previously known information to check and store
    //data that previously did not exist in the database
    function insertData (updatedDataArray, checkProp) {
        const dataChecker = updatedDataArray.map(function (datum) {
            return function (next) {
                //check the DB for the piece of datum using one of its properties
                databaseQueryExists(tableName, databasePropName, datum[checkProp], function (exists) {
                    if (exists) {
                        next();
                    }
                    else {
                        //datum doesn't exist in DB. add it!
                        const insertStr = sql.insertInto(tableName, datum).toString();
                        app.locals.db.sqlCommand(insertStr, function (err, data) {
                            next(err);
                        }); 
                    }
                });       
            };
        });
        //run the insert functions
        async.parallel(dataChecker, function (err) {
            if (err) {
                app.locals.log.error(err);
            }
            callback(); //the update cycle is done
        });
    }
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

/*
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
*/
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