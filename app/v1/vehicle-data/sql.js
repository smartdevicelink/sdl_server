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

function getEnums() {
    let sub = sql.select('max(id) AS max_spec_id')
        .from('rpc_spec');

    return sql.select('rpc_spec_type.name')
        .from('rpc_spec_type')
        .innerJoin(
            '(' + sub + ') sub',
            {
                'max_spec_id': 'rpc_spec_id'
            }
        )
        .groupBy(['rpc_spec_type.name'])
        .where(
            {
                element_type: 'ENUM'
            },
        );
}

/**
 * Returns a postgres sql string to run.
 * @param isProduction
 * @param id
 * @param hideDeleted
 */
function getVehicleData(isProduction, id, hideDeleted = false) {
    let statement;
    //if looking for production just filter on the status.
    if (isProduction) {
        statement = sql.select('view_custom_vehicle_data.*')
            .from('view_custom_vehicle_data')
            .where(
                {
                    status: 'PRODUCTION'
                }
            );
    } else { //if staging, select the most recently update custom_vehicle_data record regardless of status.
        let sub = sql.select('max(view_custom_vehicle_data.id) AS id')
            .from('view_custom_vehicle_data')
            .groupBy(['view_custom_vehicle_data.name', 'view_custom_vehicle_data.parent_id']);

        statement = sql.select('view_custom_vehicle_data.*')
            .from('(' + sub + ') sub')
            .innerJoin(
                'view_custom_vehicle_data',
                {
                    'view_custom_vehicle_data.id': 'sub.id'
                }
            );
    }

    if (id) {
        statement.where(
            {
                'view_custom_vehicle_data.id': id
            }
        );
    } else { //remove any old staging custom_vehicle_data records.
        statement.where(
            {
                'view_custom_vehicle_data.parent_id': null
            }
        );
    }

    let unionStatement = sql.select('cvd.*').from('view_custom_vehicle_data cvd')
        .join('children c',
              {
                  'c.id': 'cvd.parent_id'
              }
        );

    statement.union(unionStatement);

    if (hideDeleted) {
        statement.where(
            {
                'view_custom_vehicle_data.is_deleted': false
            }
        );
    } else {
        statement.where(
            sql.or(
                {
                    'view_custom_vehicle_data.is_deleted': false,
                    'view_custom_vehicle_data.status': 'STAGING'
                }
            )
        );
    }

    let str = `WITH RECURSIVE children AS (
        ${statement.toString()}
    ) SELECT * FROM children ORDER BY LOWER(children.name) ASC;`;

    return str;
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

function insertCustomVehicleData(obj, isProduction = true) {
    let data = {
        parent_id: obj.parent_id,
        name: obj.name,
        type: obj.type,
        key: obj.key,
        mandatory: obj.mandatory,
        min_length: obj.min_length,
        max_length: obj.max_length,
        min_size: obj.min_size,
        max_size: obj.max_size,
        max_value: obj.max_value,
        array: obj.array === true,
        is_deleted: obj.is_deleted === true
    };
    if (isProduction) {
        data.status = 'PRODUCTION';
    } else {
        data.status = 'STAGING';
    }
    return sql.insert('custom_vehicle_data', data).returning('*');
}

module.exports = {
    getEnums: getEnums,
    getVehicleData: getVehicleData,
    insertRpcSpec: insertRpcSpec,
    insertRpcSpecType: insertRpcSpecType,
    insertRpcSpecParam: insertRpcSpecParam,
    getLatestRpcSpec: getLatestRpcSpec,
    insertCustomVehicleData: insertCustomVehicleData
};
