//Copyright (c) 2018, Livio, Inc.
const check = require('check-types');
const model = require('./model.js');
const app = require('../app');
const flow = app.locals.flow;
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');

//validation functions

function validatePost (req, res) {
    //coerce to a number first. NOTE: empty string is coerced to 0
    req.body.exchange_after_x_ignition_cycles -= 0;
    req.body.exchange_after_x_kilometers -= 0;
    req.body.exchange_after_x_days -= 0;
    req.body.timeout_after_x_seconds -= 0;

    if (!check.number(req.body.exchange_after_x_ignition_cycles)) {
        return setError("exchange_after_x_ignition_cycles required");
    }
    if (!check.number(req.body.exchange_after_x_kilometers)) {
        return setError("exchange_after_x_kilometers required");
    }
    if (!check.number(req.body.exchange_after_x_days)) {
        return setError("exchange_after_x_days required");
    }
    if (!check.number(req.body.timeout_after_x_seconds)) {
        return setError("timeout_after_x_seconds required");
    }
    if (!check.array(req.body.seconds_between_retries)) {
        return setError("seconds_between_retries required");
    }
    for (let i = 0; i < req.body.seconds_between_retries.length; i++) {
        req.body.seconds_between_retries[i] -= 0;
        if (!check.number(req.body.seconds_between_retries[i])) {
            return setError(req.body.seconds_between_retries[i] + " is not a number");
        }
    }
    if (req.body.seconds_between_retries.length > 5) {
        return setError("Array length of seconds_between_retries is greater than 5");
    }
    if (!req.body.endpoints) {
        return setError("endpoints object required");
    }
    if (!req.body.endpoints["0x04"]) {
        return setError("0x04 endpoint required");
    }
    if (!req.body.endpoints.queryAppsUrl) {
        return setError("queryAppsUrl endpoint required");
    }
    if (!req.body.endpoints.lock_screen_icon_url) {
        return setError("lock_screen_icon_url endpoint required");
    }
    if (!req.body.notifications_per_minute_by_priority) {
        return setError("notifications_per_minute_by_priority object required");
    }
    req.body.notifications_per_minute_by_priority.EMERGENCY -= 0;
    req.body.notifications_per_minute_by_priority.NAVIGATION -= 0;
    req.body.notifications_per_minute_by_priority.PROJECTION -= 0;
    req.body.notifications_per_minute_by_priority.VOICECOM -= 0;
    req.body.notifications_per_minute_by_priority.COMMUNICATION -= 0;
    req.body.notifications_per_minute_by_priority.NORMAL -= 0;
    req.body.notifications_per_minute_by_priority.NONE -= 0;
    if (!check.number(req.body.notifications_per_minute_by_priority.EMERGENCY)) {
        return setError("EMERGENCY notification count required");
    }
    if (!check.number(req.body.notifications_per_minute_by_priority.NAVIGATION)) {
        return setError("NAVIGATION notification count required");
    }
    if (!check.number(req.body.notifications_per_minute_by_priority.PROJECTION)) {
        return setError("PROJECTION notification count required");
    }
    if (!check.number(req.body.notifications_per_minute_by_priority.VOICECOM)) {
        return setError("VOICECOM notification count required");
    }
    if (!check.number(req.body.notifications_per_minute_by_priority.COMMUNICATION)) {
        return setError("COMMUNICATION notification count required");
    }
    if (!check.number(req.body.notifications_per_minute_by_priority.NORMAL)) {
        return setError("NORMAL notification count required");
    }
    if (!check.number(req.body.notifications_per_minute_by_priority.NONE)) {
        return setError("NONE notification count required");
    }

    req.body.subtle_notifications_per_minute_by_priority.EMERGENCY -= 0;
    req.body.subtle_notifications_per_minute_by_priority.NAVIGATION -= 0;
    req.body.subtle_notifications_per_minute_by_priority.PROJECTION -= 0;
    req.body.subtle_notifications_per_minute_by_priority.VOICECOM -= 0;
    req.body.subtle_notifications_per_minute_by_priority.COMMUNICATION -= 0;
    req.body.subtle_notifications_per_minute_by_priority.NORMAL -= 0;
    req.body.subtle_notifications_per_minute_by_priority.NONE -= 0;
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.EMERGENCY)) {
        return setError("Subtle EMERGENCY notification count required");
    }
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.NAVIGATION)) {
        return setError("Subtle NAVIGATION notification count required");
    }
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.PROJECTION)) {
        return setError("Subtle PROJECTION notification count required");
    }
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.VOICECOM)) {
        return setError("Subtle VOICECOM notification count required");
    }
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.COMMUNICATION)) {
        return setError("Subtle COMMUNICATION notification count required");
    }
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.NORMAL)) {
        return setError("Subtle NORMAL notification count required");
    }
    if (!check.number(req.body.subtle_notifications_per_minute_by_priority.NONE)) {
        return setError("Subtle NONE notification count required");
    }
    return;

    function setError (msg) {
        res.parcel.setStatus(400).setMessage(msg);
    }
}

//helper functions

function getModuleConfigFlow (property, value) {
    const getInfoFlow = app.locals.flow({
        base: setupSql.bind(null, sql.moduleConfig[property](value)),
        retrySeconds: setupSql.bind(null, sql.retrySeconds[property](value)),
        endpointProperties: setupSql.bind(null, sql.endpointProperties[property](value))
    }, {method: 'parallel'});

    return app.locals.flow([
        getInfoFlow,
        model.transformModuleConfig
    ], {method: 'waterfall', eventLoop: true});
}

module.exports = {
    validatePost: validatePost,
    getModuleConfigFlow: getModuleConfigFlow
}