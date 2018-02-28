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

module.exports = {
    moduleConfig: {
        id: moduleConfigById,
        status: moduleConfigByStatus
    },
    retrySeconds: {
        id: retrySecondsById,
        status: retrySecondsByStatus
    }
}