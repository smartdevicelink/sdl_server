//Copyright (c) 2018, Livio, Inc.
const sql = require('sql-bricks-postgres');
const _ = require('lodash');

function moduleConfigById (id) {
    return sql.select('*')
        .from('module_config')
        .where({id: id});
}

function retrySecondsById (id) {
    return sql.select('*')
        .from('module_config_retry_seconds')
        .where({id: id})
        .orderBy('module_config_retry_seconds.order');
}

function moduleConfigByStatus (isProduction) {
    const tableName = isProduction ? 'view_module_config_production' : 'view_module_config_staging';
    return sql.select('*').from(tableName);
}

function getAllExpiredModuleCertificates () {
    return sql.select('*')
        .from('view_module_config')
        .where(
            sql.or(
                //checks if the certificate is going to expire within a day
                sql.lt('expiration_ts', sql('((now() AT TIME ZONE \'UTC\') + \'1 day\'::interval)')),
                sql.isNull('expiration_ts')
            )
        );
}

function retrySecondsByStatus (isProduction) {
    return sql.select('module_config_retry_seconds.*')
        .from('(' + moduleConfigByStatus(isProduction) + ') vmc')
        .innerJoin('module_config_retry_seconds', {'vmc.id': 'module_config_retry_seconds.id'})
        .orderBy('module_config_retry_seconds.order');
}

function endpointPropertiesById (id) {
    return sql.select('*')
        .from('module_config_endpoint_property')
        .where({
            "module_config_id": id
        });
}

function endpointPropertiesByStatus (isProduction) {
    return sql.select('module_config_endpoint_property.*')
        .from('(' + moduleConfigByStatus(isProduction) + ') vmc')
        .innerJoin('module_config_endpoint_property', {'vmc.id': 'module_config_endpoint_property.module_config_id'});
}


function insertModuleConfig (moduleConfig) {
    return sql.insert('module_config', {
        status: moduleConfig.status,
        exchange_after_x_ignition_cycles: moduleConfig.exchange_after_x_ignition_cycles,
        exchange_after_x_kilometers: moduleConfig.exchange_after_x_kilometers,
        exchange_after_x_days: moduleConfig.exchange_after_x_days,
        timeout_after_x_seconds: moduleConfig.timeout_after_x_seconds,
        endpoint_0x04: moduleConfig.endpoints["0x04"],
        query_apps_url: moduleConfig.endpoints.queryAppsUrl,
        lock_screen_default_url: moduleConfig.endpoints.lock_screen_icon_url,
        lock_screen_dismissal_enabled: moduleConfig.lock_screen_dismissal_enabled === true,
        custom_vehicle_data_mapping_url: moduleConfig.endpoints.custom_vehicle_data_mapping_url,
        emergency_notifications: moduleConfig.notifications_per_minute_by_priority.EMERGENCY,
        navigation_notifications: moduleConfig.notifications_per_minute_by_priority.NAVIGATION,
        projection_notifications: moduleConfig.notifications_per_minute_by_priority.PROJECTION,
        voicecom_notifications: moduleConfig.notifications_per_minute_by_priority.VOICECOM,
        communication_notifications: moduleConfig.notifications_per_minute_by_priority.COMMUNICATION,
        normal_notifications: moduleConfig.notifications_per_minute_by_priority.NORMAL,
        none_notifications: moduleConfig.notifications_per_minute_by_priority.NONE,
        subtle_emergency_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.EMERGENCY,
        subtle_navigation_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.NAVIGATION,
        subtle_projection_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.PROJECTION,
        subtle_voicecom_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.VOICECOM,
        subtle_communication_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.COMMUNICATION,
        subtle_normal_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.NORMAL,
        subtle_none_notifications: moduleConfig.subtle_notifications_per_minute_by_priority.NONE,
        certificate: moduleConfig.certificate,
        private_key: moduleConfig.private_key,
        expiration_ts: moduleConfig.expiration_ts,
    })
    .returning('*');
}

function insertRetrySeconds (secondsArray, id) {
    return sql.insert('module_config_retry_seconds', secondsArray.map(function (seconds, index) {
        return {
            id: id,
            seconds: seconds,
            order: index
        }
    }));
}

function insertEndpointProperties (endpointPropertiesObject, id) {
    // flatten endpoint properties into an array of simple objects
    let inserts = [];
    for (let key in endpointPropertiesObject) {
        for (let propKey in endpointPropertiesObject[key]) {
            let insertObj = {
                module_config_id: id,
                endpoint_name: key
            };

            insertObj.property_name = propKey;
            insertObj.property_value = endpointPropertiesObject[key][propKey];

            inserts.push(insertObj);
        }
    }

    return sql.insert('module_config_endpoint_property', inserts);
}

function updateModuleConfig (id, fields) {
    return sql.update('module_config', fields)
        .where({
            id: id
        })
        .returning('*');
}

module.exports = {
    insertModuleConfig: insertModuleConfig,
    insertRetrySeconds: insertRetrySeconds,
    insertEndpointProperties: insertEndpointProperties,
    getAllExpiredModuleCertificates: getAllExpiredModuleCertificates,
    updateModuleConfig: updateModuleConfig,
    moduleConfig: {
        id: moduleConfigById,
        status: moduleConfigByStatus
    },
    retrySeconds: {
        id: retrySecondsById,
        status: retrySecondsByStatus
    },
    endpointProperties: {
        id: endpointPropertiesById,
        status: endpointPropertiesByStatus
    }
}
