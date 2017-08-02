//objects used to reference when attempting updates on the DB
const hmiLevelUpdate = {
    getDataFunc: function (appObj) {
        return [appObj.default_hmi_level];
    },
    tableName: 'hmi_levels',
    databasePropName: 'id',
    moduleFuncName: 'getHmiLevels',
    transformDataFunc: function (hmiLevel) {
        return {
            id: hmiLevel
        };
    },
    errorCallback: function (hmiLevel) {
        app.locals.log.info("HMI level not found in database." + hmiLevel);  
        app.locals.log.info("Getting HMI level updates");  
    }
};

const countriesUpdate = {
    getDataFunc: function (appObj) {
        return appObj.countries.map(function (country) {
            return country.iso;
        });
    },
    tableName: 'countries',
    databasePropName: 'iso',
    moduleFuncName: 'getCountries',
    transformDataFunc: function (country) {
        return { 
            iso: country.iso,
            name: country.name
        };
    },
    errorCallback: function (countryIso) {
        app.locals.log.info("Country ISO not found in local database: " + countryIso);
        app.locals.log.info("Getting country updates");
    }
};

const categoriesUpdate = {
    getDataFunc: function (appObj) {
        return [appObj.category.id];
    },
    tableName: 'categories',
    databasePropName: 'id',
    moduleFuncName: 'getCategories',
    transformDataFunc: function (category) {
        return {
            id: category.id,
            display_name: category.display_name
        };
    },
    errorCallback: function (categoryId) {
        app.locals.log.info("Category ID not found in local database: " + categoryId);
        app.locals.log.info("Getting category updates");
    }
};

const rpcNamesUpdate = {
    getDataFunc: function (appObj) {
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
        return rpcPermissionKeys;
    },
    tableName: 'rpc_names',
    databasePropName: 'rpc_name',
    moduleFuncName: 'getRpcPermissions',
    transformDataFunc: function (permission) {
        return {
            rpc_name: permission
        };
    },
    errorCallback: function (permissionName) {
        app.locals.log.info("RPC permission not found in local database: " + permissionName);
        app.locals.log.info("Getting RPC permission updates");
    }
};

const vehicleDataUpdate = {
    getDataFunc: function (appObj) {
        const vehicleDataPermissions = appObj.permissions.filter(function (perm) {
            return perm.is_parameter;
        });
        return vehicleDataPermissions.map(function (permission) {
            return permission.key;
        });
    },
    tableName: 'vehicle_data',
    databasePropName: 'component_name',
    moduleFuncName: 'getVehicleDataPermissions',
    transformDataFunc: function (permission) {
        return {
            component_name: permission
        };
    },
    errorCallback: function (permissionName) {
        app.locals.log.info("Vehicle data permission not found in local database: " + permissionName);
        app.locals.log.info("Getting vehicle data permission updates");
    }
};

module.exports = {
    hmiLevelUpdate: hmiLevelUpdate,
    countriesUpdate: countriesUpdate,
    categoriesUpdate: categoriesUpdate,
    rpcNamesUpdate: rpcNamesUpdate,
    vehicleDataUpdate: vehicleDataUpdate
};
