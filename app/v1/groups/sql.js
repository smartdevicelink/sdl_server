const sql = require('sql-bricks-postgres');

const permissionRelationsNoModules = sql.select('child_permission_name', 'parent_permission_name')
    .from('permission_relations')
    .innerJoin('permissions', {
        'permissions.name': 'permission_relations.child_permission_name'
    })
    .where(
        sql.notEq('type', 'MODULE')
    )
    .toString();

const rpcs = sql.select('*')
    .from('permissions')
    .where({
        type: 'RPC'
    })
    .toString();

const hmiLevels = sql.select('hmi_level_enum AS id')
    .from('hmi_levels')
    .innerJoin('hmi_level_conversion', {
        'hmi_levels.id': 'hmi_level_conversion.hmi_level_text'
    })
    .toString();

const getGroupNamesStaging = sql.select('property_name')
    .from('(' + getFuncGroupStatus(false) + ') fgi')
    .toString();

function getFuncGroupId (id) {
    return sql.select('*').from('function_group_info')
        .where({
            id: id
        })
        .orderBy('LOWER(function_group_info.property_name)')
        .toString();
}

function getFuncGroupHmiLevelsId (id) {
    return sql.select('function_group_id', 'permission_name', 'hmi_level')
        .from('function_group_hmi_levels')
        .where({
            function_group_id: id
        })
        .toString();
}

function getFuncGroupParametersId (id) {
    return sql.select('function_group_id', 'rpc_name', 'parameter')
        .from('function_group_parameters')
        .where({
            function_group_id: id
        })
        .toString();
}

function getFuncGroupStatus (isProduction, hideDeleted = false) {
    const funcGroupsProduction = sql.select('*')
        .from('view_function_group_info')
        .where({
            status: 'PRODUCTION',
            'is_deleted': false
        })
        .orderBy('LOWER(view_function_group_info.property_name)');

    const funcGroupsGroup = sql.select('max(id) AS id', 'property_name')
        .from('view_function_group_info')
        .groupBy('property_name');
        
    let funcGroupsStaging = sql.select('view_function_group_info.*')
        .from('(' + funcGroupsGroup + ') vfgi')
        .innerJoin('view_function_group_info', {
            'view_function_group_info.id': 'vfgi.id'
        });

        if (hideDeleted) {
            funcGroupsStaging.where(
                {
                    'is_deleted': false
                }
            );
        }
        else {
            funcGroupsStaging.where(
                sql.or({
                    'is_deleted': false,
                    'status': 'STAGING'
                })
            );
        }

        funcGroupsStaging = funcGroupsStaging.orderBy('LOWER(view_function_group_info.property_name)');

    if (isProduction) {
        //filter out so only production entries exist
        return funcGroupsProduction;
    }
    else {
        //filter out based on highest id
        return funcGroupsStaging;
    }
}

function getFuncGroupHmiLevelsStatus (isProduction, hideDeleted = false) {
    return sql.select('function_group_id', 'permission_name', 'hmi_level')
        .from('(' + getFuncGroupStatus(isProduction, hideDeleted) + ') fgi')
        .innerJoin('function_group_hmi_levels', {
            'fgi.id': 'function_group_hmi_levels.function_group_id'
        })
        .toString();
}

function getFuncGroupParametersStatus (isProduction, hideDeleted = false) {
    return sql.select('function_group_id', 'rpc_name', 'parameter')
        .from('(' + getFuncGroupStatus(isProduction, hideDeleted) + ') fgi')
        .innerJoin('function_group_parameters', {
            'fgi.id': 'function_group_parameters.function_group_id'
        })
        .toString();
}


function getFuncGroupsByIdsStagingFilter (ids) {
    return sql.select('*')
        .from('function_group_info')
        .where(
            sql.and(
                sql.in('id', ids),
                {
                    status: 'STAGING'
                }
            )
        )
        .toString()
}

function getFuncGroupHmiLevelsByIdsStagingFilter (ids) {
    return sql.select('function_group_hmi_levels.*')
        .from('function_group_hmi_levels')
        .innerJoin('function_group_info', {
            'function_group_info.id': 'function_group_hmi_levels.function_group_id'
        })
        .where(
            sql.and(
                sql.in('id', ids),
                {
                    status: 'STAGING'
                }
            )
        )
        .toString();
}

function getFuncGroupParametersByIdsStagingFilter (ids) {
    return sql.select('function_group_parameters.*')
        .from('function_group_parameters')
        .innerJoin('function_group_info', {
            'function_group_info.id': 'function_group_parameters.function_group_id'
        })
        .where(
            sql.and(
                sql.in('id', ids),
                {
                    status: 'STAGING'
                }
            )
        )
        .toString();
}

function insertFuncGroupInfo (objs) {
    return objs.map(function (obj) {
        return sql.insert('function_group_info', {
            property_name: obj.property_name,
            user_consent_prompt: obj.user_consent_prompt,
            status: obj.status,
            is_default: obj.is_default,
            description: obj.description,
            is_deleted: obj.is_deleted
        })
        .returning('*')
        .toString(); //return the results of the inserts
    });
}

function insertHmiLevels (hmiLevels) {
    return hmiLevels.map(function (obj) {
        return sql.insert('function_group_hmi_levels', {
            permission_name: obj.permission_name,
            hmi_level: obj.hmi_level,
            function_group_id: obj.function_group_id
        })
        .toString();
    });
}

function insertParameters (parameters) {
    return parameters.map(function (obj) {
        return sql.insert('function_group_parameters', {
            rpc_name: obj.rpc_name,
            parameter: obj.parameter,
            function_group_id: obj.function_group_id
        })
        .toString();
    });
}

module.exports = {
    rpcs: rpcs,
    hmiLevels: hmiLevels,
    permissionRelationsNoModules: permissionRelationsNoModules,
    getGroupNamesStaging: getGroupNamesStaging,
    getFuncGroup: {
        base: {
            idFilter: getFuncGroupId,
            statusFilter: getFuncGroupStatus,
            ids: getFuncGroupsByIdsStagingFilter
        },
        hmiLevels: {
            idFilter: getFuncGroupHmiLevelsId,
            statusFilter: getFuncGroupHmiLevelsStatus,
            ids: getFuncGroupHmiLevelsByIdsStagingFilter
        },
        parameters: {
            idFilter: getFuncGroupParametersId,
            statusFilter: getFuncGroupParametersStatus,
            ids: getFuncGroupParametersByIdsStagingFilter
        }
    },
    insertFuncGroupInfo: insertFuncGroupInfo,
    insertHmiLevels: insertHmiLevels,
    insertParameters: insertParameters
}

