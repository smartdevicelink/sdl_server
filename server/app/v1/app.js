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
            //the end of a very large update cycle
        });
    });
    //TODO: temporary
    res.sendStatus(200);
});

//a request came from sdl_core!
app.post('/policy', function (req, res, next) {
    //given an app id, generate a policy table based on the permissions granted to it

    //iterate over the app_policies object. query the database for matching app ids that have been approved
});


function evaluateAppRequest (appObj, callback) {
    app.locals.log.info(JSON.stringify(appObj, null, 4));
    
    //TODO: test if adding a vin to on/sub/unsub vehicle data will crash things.
    //TODO: change when SHAID changes its output to distinguish between different permissions
    let rpcPermissions = [];
    let vehicleDataPermissions = [];
    for (let i = 0; i < appObj.permissions.length; i++) {
        const perm = appObj.permissions[i];
        if (perm.key.charAt(0).toLowerCase() === perm.key.charAt(0)) { //first letter is lowercase
            vehicleDataPermissions.push(perm);
        }
        else { //first letter is uppercase
            rpcPermissions.push(perm);
        }
    }

    async.parallel([
        function (next) {
            //hmi level check
            performUpdateCycle([appObj.default_hmi_level], 'hmi_levels', 'id', 'getHmiLevels', function (hmiLevel) {
                app.locals.log.info("HMI level not found in database." + hmiLevel);  
                app.locals.log.info("Getting HMI level updates");  
            }, function (hmiLevel) {
                return {
                    id: hmiLevel
                };
            }, function () {
                next();
            });
        },
        function (next) {
            //countries check
            const countryValuesArray = appObj.countries.map(function (country) {
                return country.id;
            });
            performUpdateCycle(countryValuesArray, 'countries', 'id', 'getCountries', function (countryId) {
                app.locals.log.info("Country ID not found in local database: " + countryId);
                app.locals.log.info("Getting country updates");
            }, function (country) {
                return { 
                    id: country.id,
                    iso: country.iso,
                    name: country.name
                };
            }, function () {
                next();
            });
        },
        function (next) {
            //categories check
            performUpdateCycle([appObj.category.id], 'categories', 'id', 'getCategories', function (categoryId) {
                app.locals.log.info("Category ID not found in local database: " + categoryId);
                app.locals.log.info("Getting category updates");
            }, function (category) {
                return {
                    id: category.id,
                    display_name: category.display_name
                };
            }, function () {
                next();
            });
        },
        function (next) {
            //rpc permissions check
            const rpcPermissionKeys = rpcPermissions.map(function (permission) {
                return permission.key;
            });
            performUpdateCycle(rpcPermissionKeys, 'rpc_names', 'rpc_name', 'getRpcPermissions', function (permissionName) {
                app.locals.log.info("RPC permission not found in local database: " + permissionName);
                app.locals.log.info("Getting RPC permission updates");
            }, function (permission) {
                return {
                    rpc_name: permission
                };
            }, function () {
                next();
            });
        },
        function (next) {
            //vehicle data permissions check
            const vehicleDataPermissionKeys = vehicleDataPermissions.map(function (permission) {
                return permission.key;
            });
            performUpdateCycle(vehicleDataPermissionKeys, 'vehicle_data', 'component_name', 'getVehicleDataPermissions', function (permissionName) {
                app.locals.log.info("Vehicle data permission not found in local database: " + permissionName);
                app.locals.log.info("Getting vehicle data permission updates");
            }, function (permission) {
                return {
                    component_name: permission
                };
            }, function () {
                next();
            });
        },
    ], function (err) {
        //database is updated. attempt the insert now
        insertAppRequest(appObj, rpcPermissions, vehicleDataPermissions, callback);
    });
}

function insertAppRequest (appObj, rpcPermissions, vehicleDataPermissions, callback) {
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

    async.series([
        function (next) {
            app.locals.db.sqlCommand(vendorInsertStr, function (err, data) {
                next(err);
            });            
        },
        function (next) {
            app.locals.db.sqlCommand(appInsertStr, function (err, data) {
                next(err);
            });            
        }
    ], function (err, results) {
        if (err) {
            //error while trying to insert data! there's nothing else that can be done
            app.locals.log.error("App information insert failed!");
            app.locals.log.error(JSON.stringify(newAppObj, null, 4));
            app.locals.log.error(err);
            callback(); //we're done here. no sense in inserting anything else            
        }
        else {
            getExtraInformation(function (data) {
                //use this data to help insert app request information
                addInformation(data);
            });
        }
    });


    function getExtraInformation (callback) {
        //get extra id information that we need
        async.series({
            appId: function (next) {
                const queryStr = sql.select('max(id)').from('app_info').where({app_uuid: appObj.uuid}).toString();
                //get the generated id from the most recent version of this uuid in the database
                app.locals.db.sqlCommand(queryStr, function (err, data) {
                    next(err, data.rows[0].max);
                }); 
            },
            rpcNames: function (next) {
                const queryStr = sql.select('*').from('rpc_names').toString();
                app.locals.db.sqlCommand(queryStr, function (err, data) {
                    next(err, data.rows);
                }); 
            },
            vehicleDataNames: function (next) {
                const queryStr = sql.select('*').from('vehicle_data').toString();
                app.locals.db.sqlCommand(queryStr, function (err, data) {
                    next(err, data.rows);
                }); 
            },            
        }, function (err, data) {
            if (err) {
                app.locals.log.error(err);
            }
            callback(data);
        });
    }

    function addInformation (data) {
        //insert the extra information about the app
        const appCountries = appObj.countries.map(function (country) {
            return {
                app_id: data.appId,
                country_id: country.id
            };
        });
        const displayNames = appObj.display_names.map(function (displayName) {
            return {
                app_id: data.appId,
                display_text: displayName
            };
        });
        //the ids here need to be looked up in the database, as the database generated its own ids for these values
        const rpcPermissionIds = rpcPermissions.map(function (permission) {
            return {
                app_id: data.appId,
                rpc_id: findByProperty(data.rpcNames, 'rpc_name', permission.key).id
            };
        });       
        const vehicleDataPermissionIds = vehicleDataPermissions.map(function (permission) {
            return {
                app_id: data.appId,
                vehicle_id: findByProperty(data.vehicleDataNames, 'component_name', permission.key).id
            };
        });

        let insertStrings = [];
        if (appCountries.length > 0) {
            insertStrings.push(sql.insert('app_countries').values(appCountries).toString());
        }
        if (displayNames.length > 0) {
            insertStrings.push(sql.insert('display_names').values(displayNames).toString());
        }
        if (rpcPermissionIds.length > 0) {
            insertStrings.push(sql.insert('app_rpc_permissions').values(rpcPermissionIds).toString());
        }
        if (vehicleDataPermissionIds.length > 0) {
            insertStrings.push(sql.insert('app_vehicle_permissions').values(vehicleDataPermissionIds).toString());
        }

        const insertFunctions = insertStrings.map(function (insertStr) {
            return function (next) {
                app.locals.db.sqlCommand(insertStr, function (err, data) {
                    next(err);
                });                 
            }
        });

        async.parallel(insertFunctions, function (err) {
            if (err) {
                app.locals.log.error(err);
            }
            callback();
        });         
    }

}

//helper function. returns an element in the array whose property's value matches the one passed in
function findByProperty (array, propName, propValue) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][propName] === propValue) {
            return array[i];
        }
    }
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
                //send this info back to the caller so the caller can transform the data
                const transformedDataArray = updatedDataArray.map(function (datum) {
                    return transformDataFunc(datum);
                });
                insertData(transformedDataArray);
            });
        }
        else { //nothing missing!
            callback();
        }
    });

    //stage two: uses the updated data array and previously known information to check and store
    //data that previously did not exist in the database
    function insertData (updatedDataArray) {
        const dataChecker = updatedDataArray.map(function (datum) {
            return function (next) {
                //check the DB for the piece of datum using one of its properties
                databaseQueryExists(tableName, databasePropName, datum[databasePropName], function (exists) {
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
