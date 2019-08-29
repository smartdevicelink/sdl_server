//Copyright (c) 2019, Livio, Inc.
const sql = require('sql-bricks-postgres');

function moduleConfigById(id) {
    return sql.select('*')
        .from('module_config')
        .where({ id: id });
}

function retrySecondsById(id) {
    return sql.select('*')
        .from('module_config_retry_seconds')
        .where({ id: id })
        .orderBy('module_config_retry_seconds.order');
}

function moduleConfigByStatus(isProduction) {
    const tableName = isProduction ? 'view_module_config_production' : 'view_module_config_staging';
    return sql.select('*').from(tableName);
}

function retrySecondsByStatus(isProduction) {
    return sql.select('module_config_retry_seconds.*')
        .from('(' + moduleConfigByStatus(isProduction) + ') vmc')
        .innerJoin('module_config_retry_seconds', { 'vmc.id': 'module_config_retry_seconds.id' })
        .orderBy('module_config_retry_seconds.order');
}

function insertVehicleDataItem(vehicleDataItem, vehicle_data_group_id, parent_id) {
    let data = {
        name: vehicleDataItem.name,
        vehicle_data_group_id: vehicle_data_group_id,
        parent_id: parent_id,
        key: vehicleDataItem.key,
        type: vehicleDataItem.type,
        array: vehicleDataItem.array === true,
        since: vehicleDataItem.since,
        until: vehicleDataItem.until,
        removed: vehicleDataItem.removed,
        deprecated: vehicleDataItem.deprecated,
        minvalue: vehicleDataItem.minvalue,
        maxvalue: vehicleDataItem.maxvalue,
        minsize: isNaN(parseInt(vehicleDataItem.minsize)) ? null : parseInt(vehicleDataItem.minsize),
        maxsize: isNaN(parseInt(vehicleDataItem.maxsize)) ? null : parseInt(vehicleDataItem.maxsize),
        minlength: isNaN(parseInt(vehicleDataItem.minlength)) ? null : parseInt(vehicleDataItem.minlength),
        maxlength: isNaN(parseInt(vehicleDataItem.maxlength)) ? null : parseInt(vehicleDataItem.maxlength),
    };

    return sql.insert('vehicle_data', data)
        .returning('*');
}

function insertVehicleData(vehicleData) {
    return sql.insert('vehicle_data_group', {
        status: vehicleData.status,
        schema_version: vehicleData.schema_version,
    })
        .returning('*');
}

function insertRetrySeconds(secondsArray, id) {
    return sql.insert('module_config_retry_seconds', secondsArray.map(function(seconds, index) {
        return {
            id: id,
            seconds: seconds,
            order: index
        };
    }));
}

function insertVehicleDataReservedParams(vehicleDataReservedParams) {
    return vehicleDataReservedParams.map(function(param) {
        return sql.insert('vehicle_data_reserved_params', 'id')
            .select
            (
                `'${param}' AS id`
            )
            .where(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('vehicle_data_reserved_params p')
                            .where({
                                       'p.id': param
                                   })
                    )
                )
            )
            .toString();
    });
}

function insertVehicleDataEnums(enums) {
    return enums.map(function(param) {
        return sql.insert('vehicle_data_enums', 'id')
            .select
            (
                `'${param}' AS id`
            )
            .where(
                sql.not(
                    sql.exists(
                        sql.select('*')
                            .from('vehicle_data_enums e')
                            .where({
                                       'e.id': param
                                   })
                    )
                )
            )
            .toString();
    });
}

module.exports = {
    insert: {
        vehicleDataReservedParams: insertVehicleDataReservedParams,
        vehicleDataEnums: insertVehicleDataEnums,
    },
    insertVehicleDataItem: insertVehicleDataItem,
    insertVehicleData: insertVehicleData,
    insertRetrySeconds: insertRetrySeconds,
    moduleConfig: {
        id: moduleConfigById,
        status: moduleConfigByStatus
    },
    retrySeconds: {
        id: retrySecondsById,
        status: retrySecondsByStatus
    }
};
