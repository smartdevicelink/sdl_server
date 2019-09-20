const sql = require('sql-bricks-postgres');
const funcGroupSql = require('../groups/sql.js');

function getBaseAppInfo (isProduction, useLongUuids = false, appUuids) {
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
        );
    if(useLongUuids){
        innerSelect.where(
            sql.in('app_uuid', appUuids)
        );
    }else{
        innerSelect.where(
            sql.in('app_short_uuid', appUuids)
        );
    }


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
        //adds functional groups marked as default
        {
            'view_function_group_info.is_default': true
        },
        //adds functional groups which contain an RPC in the HMI level the app is requesting
        sql.exists(
            sql.select()
                .from('app_permissions ap')
                .join('hmi_level_conversion hlc', {
                    'hlc.hmi_level_text': 'ap.hmi_level'
                })
                .join('function_group_hmi_levels fghl', {
                    'fghl.permission_name': 'ap.permission_name',
                    'fghl.hmi_level': 'hlc.hmi_level_enum'
                })
                .where({
                    'ap.app_id': appObj.id,
                    'fghl.function_group_id': sql('view_function_group_info.id')
                })
        ),
        //adds functional groups which contain a parameter in the HMI level the app is requesting
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
        //adds functional groups containing RPCs with the associated MODULES the app is requesting
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
        ),
        //adds functional groups with is_app_provider_group set to true for an app that is
        //allowed at least one app service type permission
        sql.exists(
            sql.select()
                .from('app_service_types')
                //must contain the passed in id at least once
                //must have is_app_provider_group set to true
                .where({
                    'app_id': appObj.id,
                    'view_function_group_info.is_app_provider_group': true
                })
        ),
        //adds functional groups with is_administrator_group set to true and app flagged
        sql.exists(
            sql.select()
                .from('app_oem_enablements aoe')
                .where({
                    'aoe.app_uuid': appObj.app_uuid,
                    'aoe.key': 'administrator_fg',
                    'view_function_group_info.is_administrator_group': true
                })
        ),
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

