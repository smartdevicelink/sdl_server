//Copyright (c) 2018, Livio, Inc.
const sql = require('sql-bricks-postgres');

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

function retrySecondsByStatus (isProduction) {
    return sql.select('module_config_retry_seconds.*')
        .from('(' + moduleConfigByStatus(isProduction) + ') vmc')
        .innerJoin('module_config_retry_seconds', {'vmc.id': 'module_config_retry_seconds.id'})
        .orderBy('module_config_retry_seconds.order');
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
        emergency_notifications: moduleConfig.notifications_per_minute_by_priority.EMERGENCY,
        navigation_notifications: moduleConfig.notifications_per_minute_by_priority.NAVIGATION,
        voicecom_notifications: moduleConfig.notifications_per_minute_by_priority.VOICECOM,
        communication_notifications: moduleConfig.notifications_per_minute_by_priority.COMMUNICATION,
        normal_notifications: moduleConfig.notifications_per_minute_by_priority.NORMAL,
        none_notifications: moduleConfig.notifications_per_minute_by_priority.NONE
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

module.exports = {
    insertModuleConfig: insertModuleConfig,
    insertRetrySeconds: insertRetrySeconds,
    moduleConfig: {
        id: moduleConfigById,
        status: moduleConfigByStatus
    },
    retrySeconds: {
        id: retrySecondsById,
        status: retrySecondsByStatus
    }
}