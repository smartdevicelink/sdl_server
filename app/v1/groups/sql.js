const sql = require('sql-bricks-postgres');

function getLatestRpcSpecId() {
    return sql.select('id')
        .from('rpc_spec')
        .orderBy('created_ts DESC')
        .limit(1);
}

function permissionRelationsNoModules(isProduction, hideDeleted = false) {
    let base = sql.select('child_permission_name, parent_permission_name, false::BOOLEAN AS is_custom')
        .from('permission_relations')
        .innerJoin('permissions', {
            'permissions.name': 'permission_relations.child_permission_name'
        })
        .where(
            sql.notEq('type', 'MODULE')
        );

    // retrieve root custom vehicle data items applicable only to the production status/environment
    let customVehicleDataProduction = sql.select('vcvd.name AS child_permission_name, t.parent_permission_name, true::BOOLEAN AS is_custom')
        .from('view_custom_vehicle_data vcvd')
        .crossJoin(sql(`(VALUES ('GetVehicleData'), ('OnVehicleData'), ('SubscribeVehicleData'), ('UnsubscribeVehicleData')) AS t(parent_permission_name)`))
        .where({
            'vcvd.status': 'PRODUCTION',
            'vcvd.is_deleted': false, // production always hides deleted items
            'vcvd.parent_id': null
        });

    // this query gets the most recent custom vehicle data items, regardless of status/environment
    const customVehicleDataGroup = sql.select('max(id) AS id', 'name', 'parent_id')
        .from('view_custom_vehicle_data')
        .where({
            'parent_id': null
        })
        .groupBy('name, parent_id');

    // retrieve root custom vehicle data items applicable to the staging status/environment
    let customVehicleDataStaging = sql.select('vcvd.name AS child_permission_name, t.parent_permission_name, true::BOOLEAN AS is_custom')
        .from('(' + customVehicleDataGroup + ') cvdg')
        .join('view_custom_vehicle_data vcvd', {
            'vcvd.id': 'cvdg.id'
        })
        .crossJoin(sql(`(VALUES ('GetVehicleData'), ('OnVehicleData'), ('SubscribeVehicleData'), ('UnsubscribeVehicleData')) AS t(parent_permission_name)`));

    // hiding deleted applies to staging
    if (hideDeleted) {
        customVehicleDataStaging.where({
            'vcvd.is_deleted': false
        });
    } else {
        customVehicleDataStaging.where(
            sql.or({
                'vcvd.is_deleted': false,
                'vcvd.status': 'STAGING'
            })
        );
    }

    return base.union(isProduction ? customVehicleDataProduction : customVehicleDataStaging)
        .orderBy('is_custom ASC')
        .toString();
}

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

let funcGroupParamOr = function() {
    return sql.or(
        // is a native Vehicle Data param
        sql.exists(
            sql.select()
            .from('rpc_spec_param rsp')
            .join('rpc_spec_type rst', {
                'rst.id': 'rsp.rpc_spec_type_id'
            })
            .where({
                'rst.rpc_spec_id': getLatestRpcSpecId(),
                'rst.element_type': 'FUNCTION',
                'rst.name': sql('fgp.rpc_name'),
                'rsp.name': sql('fgp.parameter')
            })
            .where(
                sql.in('rst.message_type', [
                    'response',
                    'notification'
                ])
            )
        ),
        // is a custom vehicle data param in the given environment
        sql.exists(
            sql.select()
            .from('view_custom_vehicle_data vcvd')
            .where({
                'vcvd.parent_id': null,
                'vcvd.is_deleted': false,
                'vcvd.name': sql('fgp.parameter')
            })
            .where(
                sql.or(
                    // always get PRODUCTION records if they are the most recent version
                    {
                        'vcvd.status': 'PRODUCTION'
                    },
                    // if the function group we're in context of is in STAGING, then allow STAGING custom vehicle data
                    // otherwise restrict the custom vehicle data to PRODUCTION records
                    {
                        'vcvd.status': sql('CASE WHEN fgi.status=\'STAGING\' THEN \'STAGING\'::edit_status ELSE \'PRODUCTION\'::edit_status END')
                    }
                )
            )
        )
    );
}

function getFuncGroupParametersId (id) {
    let query = sql.select('fgp.function_group_id', 'fgp.rpc_name', 'fgp.parameter')
        .from('function_group_parameters fgp')
        .join('function_group_info fgi', {
            'fgi.id': 'fgp.function_group_id'
        })
        .where(
            sql.and(
                {
                    'fgp.function_group_id': id
                },
                funcGroupParamOr()
            )
        )
        .toString();

    return query.toString();
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
        .select(
            '(' + sql.select('COUNT(pr.parent_permission_name)')
                .from('permission_relations pr')
                .join('permissions p', {
                    'p.name': 'pr.child_permission_name'
                })
                .where({
                    'pr.parent_permission_name': sql('function_group_hmi_levels.permission_name'),
                    'p.type': 'PARAMETER'
                })
                .toString()
            + ') AS possible_parameter_count'
        )
        .from('(' + getFuncGroupStatus(isProduction, hideDeleted) + ') fgi')
        .innerJoin('function_group_hmi_levels', {
            'fgi.id': 'function_group_hmi_levels.function_group_id'
        })
        .toString();
}

function getFuncGroupParametersStatus (isProduction, hideDeleted = false) {
    return sql.select('fgp.function_group_id', 'fgp.rpc_name', 'fgp.parameter')
        .from('(' + getFuncGroupStatus(isProduction, hideDeleted) + ') fgiv')
        .join('function_group_info fgi', {
            'fgi.id': 'fgiv.id'
        })
        .join('function_group_parameters fgp', {
            'fgiv.id': 'fgp.function_group_id'
        })
        .where(
            funcGroupParamOr()
        )
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
    return sql.select('fgp.*')
        .from('function_group_parameters fgp')
        .innerJoin('function_group_info fgi', {
            'fgi.id': 'fgp.function_group_id'
        })
        .where(
            sql.and(
                sql.in('id', ids),
                {
                    'fgi.status': 'STAGING'
                },
                funcGroupParamOr()
            )
        )
        .toString();
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
    }
}

