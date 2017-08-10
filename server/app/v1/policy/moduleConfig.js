let app = require('../app.js'),
    bricks = require('sql-bricks');

module.exports = function (appObj) {
    app = appObj;
    return {
        createModuleConfig: createModuleConfig
    };
}

function createModuleConfig(callback){
    let sql = app.locals.db.sqlCommand;
    let module_config = {}

    //TODO: assumption that there is only one module_config, would need to be altered if more than one
    sql(bricks.select('max(id) AS id', 'preloaded_pt', 'exchange_after_x_ignition_cycles', 'exchange_after_x_kilometers', 'exchange_after_x_days', 'timeout_after_x_seconds', 'endpoint_0x07', 'endpoint_0x04', 'query_apps_url', 'lock_screen_default_url', 'emergency_notifications', 'navigation_notifications', 'voicecom_notifications', 'communication_notifications', 'normal_notifications', 'none_notifications')
    .from('module_config')
    .groupBy('preloaded_pt', 'exchange_after_x_ignition_cycles', 'exchange_after_x_kilometers', 'exchange_after_x_days', 'timeout_after_x_seconds', 'endpoint_0x07', 'endpoint_0x04', 'query_apps_url', 'lock_screen_default_url', 'emergency_notifications', 'navigation_notifications', 'voicecom_notifications', 'communication_notifications', 'normal_notifications', 'none_notifications')
    .toString(), function (err, res) {
        if (err){
            console.error(err)
        } else {
            sql(bricks.select('*')
            .from('module_config_retry_seconds')
            .where({id: res.rows[0].id})
            .toString(), function (er, seconds){
                if (er) {
                    console.error(er)
                } else {
                    module_config = generateModConfig(res.rows[0], seconds.rows)
                    callback(module_config)
                }
            })
        }
    })

    function generateModConfig (data, seconds) {
        let module = {}
        module.preloaded_pt = data.preloaded_pt
        module.exchange_after_x_ignition_cycles = data.exchange_after_x_ignition_cycles
        module.exchange_after_x_kilometers = data.exchange_after_x_kilometers
        module.exchange_after_x_days = data.exchange_after_x_days
        module.timeout_after_x_seconds = data.timeout_after_x_seconds
        module.seconds_between_retries = seconds.map(function (item) {return item.seconds;})
        module.endpoints = {
            "0x07": {
                "default": [data.endpoint_0x07]
            },
            "0x04": {
                "default": [data.endpoint_0x04]
            }
        }
        module.endpoints.query_apps_url = {}
        module.endpoints.query_apps_url.default = [data.query_apps_url]
        module.endpoints.lock_screen_icon_url = {}
        module.endpoints.lock_screen_icon_url.default = [data.lock_screen_default_url]
        module.notifications_per_minute_by_priority = {}
        module.notifications_per_minute_by_priority.EMERGENCY = data.emergency_notifications
        module.notifications_per_minute_by_priority.NAVIGATION = data.navigation_notifications
        module.notifications_per_minute_by_priority.VOICECOM = data.voicecom_notifications
        module.notifications_per_minute_by_priority.COMMUNICATION = data.communication_notifications
        module.notifications_per_minute_by_priority.NORMAL = data.normal_notifications
        module.notifications_per_minute_by_priority.NONE = data.none_notifications
        return module;
    }
}