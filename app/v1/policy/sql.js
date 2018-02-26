const sql = require('sql-bricks-postgres');
const funcGroupSql = require('../groups/sql.js');

const moduleConfigInfo = sql.select('*')
    .from('view_module_config')
    .toString();

const moduleConfigRetrySeconds = sql.select('module_config_retry_seconds.*')
    .from('view_module_config')
    .innerJoin('module_config_retry_seconds', {
        'view_module_config.id': 'module_config_retry_seconds.id'
    })
    .toString();

const funcGroupInfo = sql.select('*')
    .from('view_function_group_info')
    .toString();

const funcGroupHmiLevels = sql.select('function_group_hmi_levels.*')
    .from('view_function_group_info')
    .innerJoin('function_group_hmi_levels', {
        'view_function_group_info.id': 'function_group_hmi_levels.function_group_id'
    })
    .toString();

const funcGroupParameters = sql.select('function_group_parameters.*')
    .from('view_function_group_info')
    .innerJoin('function_group_parameters', {
        'view_function_group_info.id': 'function_group_parameters.function_group_id'
    })
    .toString();

//returns a combination of message group and message text entries in a flat structure.
//this is useful for generating the policy table, but not for returning info for the UI
function getMessagesStatus (isProduction) {
    if (isProduction) {
        return sql.select('*')
            .from('view_message_text_production')
            .toString();
    }
    else {
        return sql.select('*')
            .from('view_message_text_staging')
            .toString();
    }
}

function getBaseAppInfo (isProduction, appUuids) {
    let approvalStatusArray = [];
    if (isProduction) {
        approvalStatusArray = ["ACCEPTED"];
    }
    else {
        approvalStatusArray = ["ACCEPTED", "PENDING"];
    }

    let tempTable = sql.select('app_uuid', 'max(id) AS id')
        .from('view_partial_app_info group_ai')
        .where(
            sql.in('group_ai.approval_status', approvalStatusArray)
        )
        .where(
            sql.in('group_ai.app_uuid', appUuids)
        )
        .groupBy('app_uuid');

    return sql.select('app_info.*')
        .from('('+tempTable+') ai')
        .join('app_info', {
            'app_info.id': 'ai.id'
        })
        .toString();
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
    moduleConfigInfo: moduleConfigInfo,
    moduleConfigRetrySeconds: moduleConfigRetrySeconds,
    getMessagesStatus: getMessagesStatus,
    funcGroupInfo: funcGroupInfo,
    funcGroupHmiLevels: funcGroupHmiLevels,
    funcGroupParameters: funcGroupParameters,
    getBaseAppInfo: getBaseAppInfo,
    getAppDisplayNames: getAppDisplayNames,
    getAppModules: getAppModules,
    getAppFunctionalGroups: getAppFunctionalGroups
}

