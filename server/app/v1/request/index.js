const async = require('async');
const sql = require('sql-bricks');
let app; //to be defined

module.exports = function (appObj) {
	app = appObj;
	return {
		getAppRequests: getAppRequests,
		evaluateAppRequest: evaluateAppRequest
	};
}

function getAppRequests (callback) {
    //use the data collectors to get application request data
    //SHAID should be the first module to run for this
    collectData('getAppRequests', function (err, appRequests) {
        if (err) {
            app.locals.log.error(err);
        }
		callback(appRequests);      
    });	
}

function evaluateAppRequest (appObj, callback) {
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
                return country.iso;
            });
            performUpdateCycle(countryValuesArray, 'countries', 'iso', 'getCountries', function (countryIso) {
                app.locals.log.info("Country ISO not found in local database: " + countryIso);
                app.locals.log.info("Getting country updates");
            }, function (country) {
                return { 
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
            const rpcPermissions = appObj.permissions.filter(function (perm) {
            	return !perm.is_parameter;
            });
            const rpcPermissionKeys = rpcPermissions.map(function (permission) {
                return permission.key;
            });
            //we require 4 RPC permissions to exist at all times. this is because vehicle data permissions 
            //are parameters to 4 RPC objects in the policy table
            if (rpcPermissionKeys.indexOf("OnVehicleData") === -1) {
                rpcPermissionKeys.push("OnVehicleData");
            }
            if (rpcPermissionKeys.indexOf("SubscribeVehicleData") === -1) {
                rpcPermissionKeys.push("SubscribeVehicleData");
            }
            if (rpcPermissionKeys.indexOf("UnsubscribeVehicleData") === -1) {
                rpcPermissionKeys.push("UnsubscribeVehicleData");
            }
            if (rpcPermissionKeys.indexOf("GetVehicleData") === -1) {
                rpcPermissionKeys.push("GetVehicleData");
            }           
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
            const vehicleDataPermissions = appObj.permissions.filter(function (perm) {
            	return perm.is_parameter;
            });
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
        }
    ], function (err) {
        //database is updated. 
        postUpdate(appObj, callback);
    });
}

//TODO: find a way to only run the function group generation once, as it is computationally expensive
//in the update cycles there are two update callbacks that inform whether new permissions exist. that is where you would know
//whether to run the function
function postUpdate (appObj, callback) {
    async.waterfall([
        //functional group data update. required if permissions have been added because that means
        //more function groups are possibly needed
        function (next) {
            async.parallel({
                rpcNames: function (next) {
                    databaseQuerySelect('*', 'rpc_names', {}, next);
                },
                vehicleDataNames: function (next) {
                    databaseQuerySelect('*', 'vehicle_data', {}, next);
                }       
            }, function (err, data) {
                next(err, data);
            });
        },
        function (permissions, next) {
            //store empty functional group info in the database
            app.locals.builder.initiateFunctionalGroups(permissions, function (groups) {
                databaseCheckMultiInsert('function_group_info', 'property_name', groups, function (err) {
                    next(null, permissions);
                });
            });
        },
        function (permissions, next) {
            //next, get the functional group infos just inserted so we have a reference to their ids
            //TODO: be able to specify STAGING or PRODUCTION when we add the routing for this
            const groupedFuncGroupInfoStr = sql.select('property_name', 'status', 'max(id) AS id')
                .from('function_group_info')
                .groupBy('property_name', 'status').toString();

            const fullFuncGroupInfoStr = sql.select('function_group_info.*')
                .from('(' + groupedFuncGroupInfoStr + ') group_fgi')
                .join('function_group_info', {'function_group_info.id': 'group_fgi.id'})
                .where({'group_fgi.status': 'STAGING'}).toString();

            app.locals.db.sqlCommand(fullFuncGroupInfoStr, function (err, funcGroups) {
                next(err, permissions, funcGroups.rows);
            });
        },
        function (permissions, funcGroups, next) {
            //create permissions for all the defined functional groups
            app.locals.builder.createGroupPermissions(permissions, funcGroups, function (permissionObjs) {
                next(null, permissionObjs);
            });
        },
        function (permissionObjs, next) {
            //insert the generated permissions
            const addRpcPermissionCommands = permissionObjs.rpcPermissions.map(function (perm) {
                return databaseCheckInsert('rpc_permission', 'function_group_id', perm);
            });
            const addVehiclePermissionCommands = permissionObjs.vehicleDataPermissions.map(function (perm) {
                return databaseCheckInsert('rpc_vehicle_parameters', 'function_group_id', perm);         
            });
            async.parallel(addRpcPermissionCommands.concat(addVehiclePermissionCommands), function (err) {
                callback(err, next);
            });             
        }
    ], function (err) {
        if (err) {
            app.locals.log.error(err);
        }
        insertAppRequest(appObj, callback);
    });
}

//TODO: do a timestamp check to determine if the app info actually changed before insertion
//TODO: in the migration script, add views when necessary to easily return most recent information about certain sets of data
function insertAppRequest (appObj, callback) {
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
            addExtraAppInformation(appObj, callback);
        }
    });
}

function addExtraAppInformation (appObj, callback) {
    //get extra id information that we need
    async.parallel({
        appId: function (next) {
            //TODO: make sure you can specify whether you want staging or production version
            const queryStr = sql.select('max(id)').from('app_info').where({app_uuid: appObj.uuid}).toString();
            //get the generated id from the most recent version of this uuid in the database
            app.locals.db.sqlCommand(queryStr, function (err, data) {
                next(err, data.rows[0].max);
            }); 
        },
        rpcNames: function (next) {
            databaseQuerySelect('*', 'rpc_names', {}, next);
        },
        vehicleDataNames: function (next) {
            databaseQuerySelect('*', 'vehicle_data', {}, next);
        }
    }, function (err, data) {
        if (err) {
            app.locals.log.error(err);
        }
		//insert the extra information about the app
        const appCountries = appObj.countries.map(function (country) {
            return {
                app_id: data.appId,
                country_iso: country.iso
            };
        });
        const displayNames = appObj.display_names.map(function (displayName) {
            return {
                app_id: data.appId,
                display_text: displayName
            };
        });
        //the ids here need to be looked up in the database, as the database generated its own ids for these values
        const rpcPermissions = appObj.permissions.filter(function (perm) {
        	return !perm.is_parameter;
        });       
        const vehicleDataPermissions = appObj.permissions.filter(function (perm) {
        	return perm.is_parameter;
        }); 
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
            collectData(moduleFuncName, function (err, updatedDataArray) {
                if (err) {
                    app.locals.log.error(err);
                }
                //send this info back to the caller so the caller can transform the data
                const transformedDataArray = updatedDataArray.map(function (datum) {
                    return transformDataFunc(datum);
                });
                //stage two: uses the updated data array and previously known information to check and store
                //data that previously did not exist in the database
                databaseCheckMultiInsert(tableName, databasePropName, transformedDataArray, callback);
                //update cycle done
            });
        }
        else { //nothing missing!
            callback();
        }
    });
}

/****** UTILITY FUNCTIONS ******/

//helper function. returns an element in the array whose property's value matches the one passed in
function findByProperty (array, propName, propValue) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][propName] === propValue) {
            return array[i];
        }
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
        callback(err, dataArray);
    });     
}

function databaseCheckMultiInsert (tableName, databasePropName, dataArray, callback) {
    const dataChecker = dataArray.map(function (datum) {
        return databaseCheckInsert(tableName, databasePropName, datum);
    });
    //run the insert functions
    async.parallel(dataChecker, function (err) {
        callback(err);
    });
}

//inserts a piece of data in the database only if it was checked through a property that the data doesn't exist yet
function databaseCheckInsert (tableName, databasePropName, datum) {
    //check the DB for the piece of datum using one of its properties
    return function (next) {
        databaseQueryExists(tableName, databasePropName, datum[databasePropName], function (exists) {
            if (exists) {
                next(); //don't add it
            }
            else {
                //datum doesn't exist in DB. add it!
                databaseInsert(tableName, datum, next);
            }
        });         
    } 
}

function databaseInsert (tableName, datum, callback) {
    const insertStr = sql.insertInto(tableName, datum).toString();
	app.locals.db.sqlCommand(insertStr, function (err, data) {
	    callback(err);
	}); 
}

//utility function. given a table name, a property to query and the value of the query,
//check whether that data exists in the database
function databaseQueryExists (tableName, databasePropName, dataPropValue, callback) {
    let propQuery = {};
    propQuery[databasePropName] = dataPropValue;
    databaseQuerySelect('*', tableName, propQuery, function (err, data) {
    	//return whether the data doesn't exist in the DB
    	callback(data.length !== 0);
    });
}

//utility function
function databaseQuerySelect (selectionString, tableName, matchObj, callback) {
    const queryStr = sql.select(selectionString).from(tableName).where(matchObj).toString();
    app.locals.db.sqlCommand(queryStr, function (err, data) {
        callback(err, data.rows);
    }); 
}
