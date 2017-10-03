module.exports = function (app) {
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

    const permissionDataUpdate = {
        getDataFunc: function (appObj) {
            return appObj.permissions.map(function (permission) {
                return permission.key;
            });
        },
        tableName: 'permissions',
        databasePropName: 'name',
        moduleFuncName: 'getPermissions',
        transformDataFunc: function (permission) {
            return {
                name: permission.name,
                type: permission.type
            };
        },
        errorCallback: function (permissionName) {
            app.locals.log.info("Permission not found in local database: " + permissionName);
            app.locals.log.info("Getting permission updates");
        }
    };

    return {
        hmiLevelUpdate: hmiLevelUpdate,
        countriesUpdate: countriesUpdate,
        categoriesUpdate: categoriesUpdate,
        permissionDataUpdate: permissionDataUpdate
    };
};
