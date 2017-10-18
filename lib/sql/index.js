//a repository of all the useful SQL statements
const sql = require('sql-bricks');

const funcGroupInfo = sql.select('*').from('view_function_group_info').toString();
const funcGroupHmiLevels = sql.select('function_group_hmi_levels.*').from('view_function_group_info')
    .innerJoin('function_group_hmi_levels', {'view_function_group_info.id': 'function_group_hmi_levels.function_group_id'}).toString();
const funcGroupParameters = sql.select('function_group_parameters.*').from('view_function_group_info')
    .innerJoin('function_group_parameters', {'view_function_group_info.id': 'function_group_parameters.function_group_id'}).toString();

const moduleConfigInfo = sql.select('*').from('view_module_config').toString();
const moduleConfigRetrySeconds = sql.select('module_config_retry_seconds.*').from('view_module_config')
    .innerJoin('module_config_retry_seconds', {'view_module_config.id': 'module_config_retry_seconds.id'}).toString();

const messageText = sql.select('*').from('view_message_text').toString();

module.exports = {
    funcGroup: {
        info: funcGroupInfo,
        hmiLevels: funcGroupHmiLevels,
        parameters: funcGroupParameters
    },
    messageText: messageText,
    moduleConfig: {
        info: moduleConfigInfo,
        retrySeconds: moduleConfigRetrySeconds
    }
}