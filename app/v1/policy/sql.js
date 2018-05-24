const sql = require('sql-bricks-postgres');
const funcGroupSql = require('../groups/sql.js');

function getBaseAppInfo (isProduction, appUuids) {
    let approvalStatusArray = [];
    if (isProduction) {
        approvalStatusArray = ["ACCEPTED"];
    }
    else {
        approvalStatusArray = ["ACCEPTED", "STAGING"];
    }

    const innerSelect = sql.select('*')
        .from('view_partial_app_info')
        .where(
            sql.in('approval_status', approvalStatusArray)
        )
        .where(
            sql.in('app_uuid', appUuids)
        );

    const whereIn = sql.select('max(id) AS id')
        .from('(' + innerSelect + ') AS test')
        .groupBy('app_uuid');

    return sql.select("*")
        .from("app_info")
        .where(
            sql.in('app_info.id', whereIn)
        );
}

function getAppDisplayNames (appId) {
    return sql.select('display_text')
        .from('display_names')
        .where({
            'app_id': appId
        }).toString();
}

function getAppModules (appId) {
    return sql.select('app_permissions.permission_name')
        .from('app_permissions')
        .join('permissions', {
            'app_permissions.permission_name': 'permissions.name'
        })
        .where({
            'app_permissions.app_id': appId,
            'permissions.type': 'MODULE'
        })
        .toString();
}

function getDefaultFunctionalGroups (isProduction) {
    let statement = funcGroupSql.getFuncGroup.base.statusFilter(isProduction, true)
        .where({'view_function_group_info.is_default': true});

    return statement;
}

function getPreDataConsentFunctionalGroups (isProduction) {
    let statement = funcGroupSql.getFuncGroup.base.statusFilter(isProduction, true)
        .where({'view_function_group_info.is_pre_data_consent': true});

    return statement;
}

function getDeviceFunctionalGroups (isProduction) {
    let statement = funcGroupSql.getFuncGroup.base.statusFilter(isProduction, true)
        .where({'view_function_group_info.is_device': true});

    return statement;
}

function getAppFunctionalGroups (isProduction, appObj) {
    let sqlOr = [
        {
            'view_function_group_info.is_default': true
        },
        sql.exists(
            sql.select()
                .from('app_permissions ap')
                .join('hmi_level_conversion hlc', {
                    'hlc.hmi_level_text': 'ap.hmi_level'
                })
                .join('function_group_parameters fgp', {
                    'fgp.rpc_name': 'ap.permission_name'
                })
                .where({
                    'ap.app_id': appObj.id,
                    'fgp.function_group_id': sql('view_function_group_info.id')
                })
                .where(
                    sql.exists(
                        sql.select()
                        .from('function_group_hmi_levels fghl')
                        .where({
                            'fghl.permission_name': sql('ap.permission_name'),
                            'fghl.function_group_id': sql('view_function_group_info.id'),
                            'fghl.hmi_level': sql('hlc.hmi_level_enum')
                        })
                    )
                )
        ),
        sql.exists(
            sql.select()
                .from('app_permissions ap')
                .join('hmi_level_conversion hlc', {
                    'hlc.hmi_level_text': 'ap.hmi_level'
                })
                .join('function_group_parameters fgp', {
                    'fgp.parameter': 'ap.permission_name'
                })
                .where({
                    'ap.app_id': appObj.id,
                    'fgp.function_group_id': sql('view_function_group_info.id')
                })
                .where(
                    sql.exists(
                        sql.select()
                        .from('function_group_hmi_levels fghl')
                        .where({
                            'fghl.permission_name': sql('fgp.rpc_name'),
                            'fghl.function_group_id': sql('fgp.function_group_id'),
                            'fghl.hmi_level': sql('hlc.hmi_level_enum')
                        })
                    )
                )
        ),
        sql.exists(
            sql.select()
                .from('function_group_hmi_levels fghl')
                .join('permission_relations pr', {
                    'pr.parent_permission_name': 'fghl.permission_name'
                })
                .join('permissions p', {
                    'p.name': 'pr.child_permission_name'
                })
                .join('app_permissions ap', {
                    'ap.permission_name': 'p.name'
                })
                .join('hmi_level_conversion hlc', {
                    'hlc.hmi_level_text': 'ap.hmi_level'
                })
                .where({
                    'ap.app_id': appObj.id,
                    'fghl.function_group_id': sql('view_function_group_info.id'),
                    'p.type': 'MODULE',
                    'fghl.hmi_level': sql('hlc.hmi_level_enum')
                })
        )
    ];

    if(appObj.can_background_alert){
        sqlOr.push(
            sql.exists(
                sql.select()
                    .from('function_group_hmi_levels fghl')
                    .where({
                        'fghl.function_group_id': sql('view_function_group_info.id'),
                        'fghl.permission_name': 'Alert',
                        'fghl.hmi_level': 'BACKGROUND'
                    })
            )
        );
    }

    let statement = funcGroupSql.getFuncGroup.base.statusFilter(isProduction, true)
        .where(
            sql.or(sqlOr)
        );

    return statement;
}


module.exports = {
    getBaseAppInfo: getBaseAppInfo,
    getAppDisplayNames: getAppDisplayNames,
    getAppModules: getAppModules,
    getAppFunctionalGroups: getAppFunctionalGroups,
    getDefaultFunctionalGroups: getDefaultFunctionalGroups,
    getPreDataConsentFunctionalGroups: getPreDataConsentFunctionalGroups,
    getDeviceFunctionalGroups: getDeviceFunctionalGroups
}

