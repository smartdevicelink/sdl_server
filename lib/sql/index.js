//a repository of all the useful SQL statements
const sql = require('sql-bricks');

const funcGroupInfo = sql.select('*').from('view_function_group_info').toString();
const funcGroupHmiLevels = sql.select('function_group_hmi_levels.*').from('view_function_group_info')
    .innerJoin('function_group_hmi_levels', {'view_function_group_info.id': 'function_group_hmi_levels.function_group_id'}).toString();
const funcGroupParameters = sql.select('function_group_parameters.*').from('view_function_group_info')
    .innerJoin('function_group_parameters', {'view_function_group_info.id': 'function_group_parameters.function_group_id'}).toString();

module.exports = {
    funcGroup: {
        info: funcGroupInfo,
        hmiLevels: funcGroupHmiLevels,
        parameters: funcGroupParameters
    }
}