//Copyright (c) 2019, Livio, Inc.
const sql = require('sql-bricks-postgres');

function insertRpcSpec(rpcSpec) {
    let data = {
        version: rpcSpec.version,
        min_version: rpcSpec.min_version,
        date: rpcSpec.date,
    };
    return sql.insert('rpc_spec', data).returning('*');
}

function getLatestRpcSpec() {
    return sql.select('version')
        .from('rpc_spec')
        .orderBy('created_ts DESC')
        .limit(1);
}

/**
 * Returns a postgres sql query object to run against
 * using the postgres sdl_server/custom/databases/postgres/index.js
 * module.
 * @param isProduction
 */
function getVehicleData(isProduction) {

    let statement;
    //if looking for production just filter on the status.
    if (isProduction) {
        statement = sql.select('view_custom_vehicle_data.*')
            .from('view_custom_vehicle_data')
            .where({ status: 'PRODUCTION' })
            .orderBy('view_custom_vehicle_data.id');
    } else { //if staging, select the most recently update custom_vehicle_data record regardless of status.
        let sub = sql.select('max(id) AS id')
            .from('view_custom_vehicle_data')
            .groupBy(['view_custom_vehicle_data.name', 'view_custom_vehicle_data.parent_id']);

        statement = sql.select('view_custom_vehicle_data.*')
            .from('(' + sub + ') sub')
            .innerJoin('view_custom_vehicle_data', {
                'view_custom_vehicle_data.id': 'sub.id'
            })
            .orderBy('view_custom_vehicle_data.id');
    }

    return statement;
}

function insertRpcSpecParam(rpcSpecParams, rpcSpecTypeByName) {
    let ary = [];
    for (let rpcSpecParam of rpcSpecParams) {
        rpcSpecParam['rpc_spec_type_id'] = null;
        if (rpcSpecTypeByName[rpcSpecParam.rpc_spec_type_name]) {
            rpcSpecParam['rpc_spec_type_id'] = rpcSpecTypeByName[rpcSpecParam.rpc_spec_type_name].id;
        }
        delete rpcSpecParam['rpc_spec_type_name'];

        ary.push(rpcSpecParam);
    }

    return sql.insert('rpc_spec_param', ary)
        .returning('*');
}

function insertRpcSpecType(rpc_spec_id, rpcSpecTypes) {
    for (let rpcSpecType of rpcSpecTypes) {
        rpcSpecType.rpc_spec_id = rpc_spec_id;
    }

    return sql.insert('rpc_spec_type', rpcSpecTypes)
        .returning('*');
}

function insertStagingCustomVehicleData(obj) {
    let data = {
        parent_id: obj.parent_id,
        status: 'STAGING',
        name: obj.name,
        type: obj.type,
        key: obj.key,
        mandatory: obj.mandatory,
        min_length: obj.min_length,
        max_length: obj.max_length,
        min_size: obj.min_size,
        max_size: obj.max_size,
        max_value: obj.max_value,
        array: obj.array,
    };
    return sql.insert('custom_vehicle_data', data).returning('*');
}

function insertProductionCustomVehicleData(obj) {
    let data = {
        parent_id: obj.parent_id,
        status: 'PRODUCTION',
        name: obj.name,
        type: obj.type,
        key: obj.key,
        mandatory: obj.mandatory,
        min_length: obj.min_length,
        max_length: obj.max_length,
        min_size: obj.min_size,
        max_size: obj.max_size,
        max_value: obj.max_value,
        array: obj.array,
    };
    return sql.insert('custom_vehicle_data', data).returning('*');
}

module.exports = {
    getVehicleData: getVehicleData,
    insertRpcSpec: insertRpcSpec,
    insertRpcSpecType: insertRpcSpecType,
    insertRpcSpecParam: insertRpcSpecParam,
    getLatestRpcSpec: getLatestRpcSpec,
    insertProductionCustomVehicleData: insertProductionCustomVehicleData,
    insertStagingCustomVehicleData: insertStagingCustomVehicleData,
};
