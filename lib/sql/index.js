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
    },
    insert: {
        vendor: insertVendor,
        appInfo: insertAppInfo,
        appCountries: insertAppCountries,
        appDisplayNames: insertAppDisplayNames,
        appPermissions: insertAppPermissions
    },
    timestampCheck: timestampCheck
}

//sql generating functions
function insertVendor (name, email) {
    const vendorObj = {
        vendor_name: name,
        vendor_email: email
    };
    return sql.insert('vendors', vendorObj).toString();
}

function timestampCheck (tableName, whereObj) {
    return sql.select('max(updated_ts)').from(tableName).where(whereObj).toString();
}

function insertAppInfo (appObj) {
    //attach the vendor id that matches the info in appObj from the db
    //make sure values with quotations can be inserted, too...
    return sql.insert
        ('app_info', 'app_uuid', 'name', 'platform', 'platform_app_id', 'status', 'can_background_alert', 
        'can_steal_focus', 'default_hmi_level', 'tech_email', 'tech_phone', 'category_id', 'vendor_id')
        .select
            (
            `'${appObj.uuid}' AS app_uuid`,
            `'${doubleQuotes(appObj.name)}' AS name`,
            `'${appObj.platform}' AS platform`,
            `'${appObj.platform_app_id}' AS platform_app_id`,
            `'${appObj.status}' AS status`,
            `'${appObj.can_background_alert}' AS can_background_alert`,
            `'${appObj.can_steal_focus}' AS can_steal_focus`,
            `'${appObj.default_hmi_level}' AS default_hmi_level`,
            `'${doubleQuotes(appObj.tech_email)}' AS tech_email`,
            `'${appObj.tech_phone}' AS tech_phone`,
            `${appObj.category.id} AS category_id`,
            `max(id) AS vendor_id`
            )
        .from('vendors').where({
            vendor_name: appObj.vendor.name,
            vendor_email: appObj.vendor.email
        })
        .toString();
}

function insertAppCountries (appObj) {
    return appObj.countries.map(function (country) {
        return sql.insert('app_countries', 'country_iso', 'app_id')
            .select
                (
                `'${country.iso}' AS country_iso`,
                `max(id) AS app_id`
                )
            .from('app_info').where({
                app_uuid: appObj.uuid
            })
            .toString();    
    });
}

function insertAppDisplayNames (appObj) {
    return appObj.display_names.map(function (displayName) {
        return sql.insert('display_names', 'display_text', 'app_id')
            .select
                (
                `'${displayName}' AS display_text`,
                `max(id) AS app_id`
                )
            .from('app_info').where({
                app_uuid: appObj.uuid
            })
            .toString();    
    });
}

function insertAppPermissions (appObj) {
    return appObj.permissions.map(function (permission) {
        return sql.insert('app_permissions', 'permission_name', 'hmi_level', 'app_id')
            .select
                (
                `'${permission.key}' AS permission_name`,
                `'${permission.hmi_level}' AS hmi_level`,
                `max(id) AS app_id`
                )
            .from('app_info').where({
                app_uuid: appObj.uuid
            })
            .toString();    
    });
}

//for SQL statements not handled by sql-bricks whose values may contain quotations
function doubleQuotes (str) {
    if (str !== null) {
        return str.replace("'", "''");
    }
    else {
        return null;
    }
} 
