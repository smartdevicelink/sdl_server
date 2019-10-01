//Copyright (c) 2019, Livio, Inc.
const sql = require('sql-bricks-postgres');

function insertRpcSpec(rpcSpec) {
    let data = {
        version: rpcSpec.version,
        min_version: rpcSpec.min_version,
        date: rpcSpec.date,
    };
    return sql.insert('rpc_spec', data)
        .returning('*');
}

function getLatestRpcSpec() {
    return sql.select('version')
        .from('rpc_spec')
        .orderBy('created_ts DESC')
        .limit(1);
}



function insertRpcSpecParam(rpcSpecParams, rpcSpecTypeByName) {
    let ary = [];
    for (let rpcSpecParam of rpcSpecParams) {
        if (rpcSpecTypeByName[rpcSpecParam.rpc_spec_type_name]) {
            rpcSpecParam['rpc_spec_type_id'] = rpcSpecTypeByName[rpcSpecParam.rpc_spec_type_name].id;
        }
        else {
            rpcSpecParam['rpc_spec_type_id'] = null;
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

module.exports = {
    insertRpcSpec: insertRpcSpec,
    insertRpcSpecType: insertRpcSpecType,
    insertRpcSpecParam: insertRpcSpecParam,
    getLatestRpcSpec: getLatestRpcSpec,
};
