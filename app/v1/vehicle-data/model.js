//Copyright (c) 2019, Livio, Inc.
const app = require('../app');
const flame = app.locals.flame;
const db = app.locals.db;
const sql = require('./sql.js');
const async = require('async');

//keeping this synchronous due to how small the data is. pass this to the event loop
function transformModuleConfig(info, next) {
    const base = info.base;
    const retrySeconds = info.retrySeconds;

    const hashBase = {};
    //hash up base info
    for (let i = 0; i < base.length; i++) {
        hashBase[base[i].id] = base[i];
        hashBase[base[i].id] = base[i];
        hashBase[base[i].id].seconds_between_retries = [];
    }

    //retry seconds are ordered
    for (let i = 0; i < retrySeconds.length; i++) {
        hashBase[retrySeconds[i].id].seconds_between_retries.push(retrySeconds[i].seconds);
    }

    //format the module configs so the UI can use them
    let moduleConfigs = [];
    for (let id in hashBase) {
        moduleConfigs.push(baseTemplate(hashBase[id]));
    }

    next(null, moduleConfigs);
}

function baseTemplate(objOverride) {
    const obj = {
        id: 0,
        status: 'PRODUCTION',
        exchange_after_x_ignition_cycles: 0,
        exchange_after_x_kilometers: 0,
        exchange_after_x_days: 0,
        timeout_after_x_seconds: 0,
        seconds_between_retries: [],
        endpoints: {
            '0x04': '',
            'queryAppsUrl': '',
            'lock_screen_icon_url': '',
            'custom_vehicle_data_mapping_url': ''
        },
        'endpoint_properties': {
            'custom_vehicle_data_mapping_url': {
                'version': ''
            }
        },
        notifications_per_minute_by_priority: {
            EMERGENCY: 0,
            NAVIGATION: 0,
            VOICECOM: 0,
            COMMUNICATION: 0,
            NORMAL: 0,
            NONE: 0
        }
    };

    if (objOverride) {
        //add overrides to the default
        obj.id = objOverride.id;
        obj.status = objOverride.status;
        obj.exchange_after_x_ignition_cycles = objOverride.exchange_after_x_ignition_cycles;
        obj.exchange_after_x_kilometers = objOverride.exchange_after_x_kilometers;
        obj.exchange_after_x_days = objOverride.exchange_after_x_days;
        obj.timeout_after_x_seconds = objOverride.timeout_after_x_seconds;
        obj.seconds_between_retries = objOverride.seconds_between_retries;
        obj.endpoints['0x04'] = objOverride.endpoint_0x04;
        obj.endpoints.queryAppsUrl = objOverride.query_apps_url;
        obj.endpoints.lock_screen_icon_url = objOverride.lock_screen_default_url;
        obj.endpoints.custom_vehicle_data_mapping_url = objOverride.custom_vehicle_data_mapping_url;
        obj.endpoint_properties.custom_vehicle_data_mapping_url.version = objOverride.custom_vehicle_data_mapping_url_version;
        obj.notifications_per_minute_by_priority.EMERGENCY = objOverride.emergency_notifications;
        obj.notifications_per_minute_by_priority.NAVIGATION = objOverride.navigation_notifications;
        obj.notifications_per_minute_by_priority.VOICECOM = objOverride.voicecom_notifications;
        obj.notifications_per_minute_by_priority.COMMUNICATION = objOverride.communication_notifications;
        obj.notifications_per_minute_by_priority.NORMAL = objOverride.normal_notifications;
        obj.notifications_per_minute_by_priority.NONE = objOverride.none_notifications;
    }

    return obj;
}

function insertVehicleDataItem(client, item, vehicleDataGroupId, parentId, cb) {

    client.getOne(sql.insertVehicleDataItem(item, vehicleDataGroupId, parentId), function(error, newVehicleDataItem) {
        if (error) {
            console.error(error);
        }
        if (item.params) {
            let transactions = [];
            for (let param of item.params) {

                transactions.push(function(cb) {
                    insertVehicleDataItem(client, param, vehicleDataGroupId, newVehicleDataItem.id, cb);
                });
            }
            async.parallel(transactions, function() {
                               cb();
                           }
            );
        } else {
            cb();

        }
    });

}

/**
 * Get the most recent vehicle data.
 * @param isProduction
 * @param cb
 * @returns {void|*}
 */
function getVehicleData(isProduction, cb) {
    let query;
    if (isProduction) {
        query = `SELECT vd.*, vdg.schema_version, vdg.status
                 FROM vehicle_data_group vdg
                    LEFT JOIN vehicle_data vd ON vdg.id = vd.vehicle_data_group_id
                 WHERE vdg.id = (SELECT max(id) FROM vehicle_data_group WHERE status = 'PRODUCTION');`;
    } else {
        query = `SELECT vd.*, vdg.schema_version, vdg.status
                 FROM vehicle_data_group vdg
                    LEFT JOIN vehicle_data vd ON vdg.id = vd.vehicle_data_group_id
                 WHERE vdg.id = (SELECT max(id) FROM vehicle_data_group);`;
    }
    return db.getMany(query, function(err, results) {
        if (err) {
            return cb(err);
        }

        let schema_version;
        let status;
        // let schema_items = [];
        let schemaItemsById = {};

        for (let item of results) {
            if (!schema_version) {
                schema_version = item.schema_version;
            }
            if (!status) {
                status = item.status;
            }
            delete item.status;
            delete item.schema_version;
            item.params = [];
            schemaItemsById[item.id] = item;
        }

        let schema_items = [];

        for (let id in schemaItemsById) {
            let item = schemaItemsById[id];

            if (item.parent_id) {
                schemaItemsById[item.parent_id].params.push(
                    {
                        name: item.name,
                        key: item.key,
                        type: item.type,
                        array: item.array,
                        since: item.since,
                        until: item.until,
                        removed: item.removed,
                        deprecated: item.deprecated,
                        minvalue: item.minvalue,
                        maxvalue: item.maxvalue,
                        minsize: item.minsize,
                        maxsize: item.maxsize,
                        minlength: item.minlength,
                        maxlength: item.maxlength,
                        params: item.params,
                    });
            } else {
                schema_items.push({
                                      name: item.name,
                                      key: item.key,
                                      type: item.type,
                                      array: item.array,
                                      since: item.since,
                                      until: item.until,
                                      removed: item.removed,
                                      deprecated: item.deprecated,
                                      minvalue: item.minvalue,
                                      maxvalue: item.maxvalue,
                                      minsize: item.minsize,
                                      maxsize: item.maxsize,
                                      minlength: item.minlength,
                                      maxlength: item.maxlength,
                                      params: item.params,
                                  });
            }
        }

        return cb(null, {
            schema_version,
            schema_items,
            status,
        });

    });

}

function getVehicleDataParamTypes(cb) {
    let query = `SELECT id
                 FROM vehicle_data_enums vde;`;

    return db.getMany(query, function(err, results) {
        if (err) {
            return cb(err);
        }

        let primitiveTypes = ['Boolean', 'String', 'Integer', 'Float'];
        let enumTypes = results.map(function(el) {
            return el.id;
        });

        let types = primitiveTypes.concat(enumTypes);

        return cb(null, types);

    });

}

function getVehicleDataReservedParams(cb) {
    let query = `SELECT id
                 FROM vehicle_data_reserved_params;`;

    return db.getMany(query, function(err, results) {
        if (err) {
            return cb(err);
        }

        let params = results.map(function(el) {
            return el.id;
        });

        return cb(null, params);

    });
}

//store the information using a SQL transaction
function insertVehicleData(isProduction, vehicleData, next) {
    //change status
    if (isProduction) {
        vehicleData.status = 'PRODUCTION';
    } else {
        vehicleData.status = 'STAGING';
    }
    // process message groups synchronously (due to the SQL transaction)
    db.runAsTransaction(function(client, callback) {

        let transactions = [];

        //stage 1: insert module config
        transactions.push(client.getOne.bind(client, sql.insertVehicleData(vehicleData)));

        //stage 2: insert module config retry seconds

        for (let item of vehicleData.schema_items) {
            transactions.push(function(newVehicleDataGroup, next) {
                insertVehicleDataItem(client, item, newVehicleDataGroup.id, null, function(error) {
                    next(null, newVehicleDataGroup);
                });
            });
        }

        flame.async.waterfall(transactions, callback);
    }, next);
}

module.exports = {
    getVehicleData: getVehicleData,
    transformModuleConfig: transformModuleConfig,
    insertVehicleData: insertVehicleData,
    getVehicleDataParamTypes: getVehicleDataParamTypes,
    getVehicleDataReservedParams: getVehicleDataReservedParams,
};
