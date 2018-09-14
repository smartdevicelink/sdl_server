//Copyright (c) 2018, Livio, Inc.
const app = require('../app');
const flame = app.locals.flame;
const model = require('./model.js');
const setupSqlCommand = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');
const sqlApps = require('../applications/sql.js');
const funcGroupSql = require('../groups/sql.js');
const messagesSql = require('../messages/sql.js');
const moduleConfigSql = require('../module-config/sql.js');
const messages = require('../messages/helper.js');
const cache = require('../../../custom/cache');
const log = require('../../../custom/loggers/winston');
const GET = require('lodash.get');

//validation functions

function validateCorePost (req, res) {
    if (!req.body.policy_table) {
        return res.errorMsg = "Please provide policy table information";
    } else if (!req.body.policy_table.app_policies) {
        return res.errorMsg = "Please provide app policies information";
    } else if (!req.body.policy_table.consumer_friendly_messages) {
        return res.errorMsg = "Please provide consumer friendly messages information";
    } else if (!req.body.policy_table.device_data) {
        return res.errorMsg = "Please provide device data information";
    } else if (!req.body.policy_table.functional_groupings) {
        return res.errorMsg = "Please provide functional groupings information";
    } else if (!req.body.policy_table.module_config) {
        return res.errorMsg = "Please provide module config information";
    } else if (!req.body.policy_table.usage_and_error_counts) {
        return res.errorMsg = "Please provide usage and error counts information";
    }
}

function validateAppPolicyOnlyPost (req, res) {
    if (!req.body.policy_table) {
        return res.errorMsg = "Please provide policy table information";
    } else if (!req.body.policy_table.app_policies) {
        return res.errorMsg = "Please provide app policies information";
    }
}

//helper functions

function generatePolicyTable (isProduction, useLongUuids = false, appPolicyObj, returnPreview, cb) {
    let makePolicyTable = {};
    if (appPolicyObj) { //existence of appPolicyObj implies to return the app policy object
        makePolicyTable.appPolicies = setupAppPolicies(isProduction, useLongUuids, appPolicyObj);
    }

    cache.getCacheData(isProduction, app.locals.version, cache.policyTableKey, function (err, cacheData) {
        if (GET(cacheData, "moduleConfig")
        && GET(cacheData, "functionalGroups")
        && GET(cacheData, "consumerFriendlyMessages")) {
            if(cacheData.moduleConfig){
                cacheData.moduleConfig.full_app_id_supported = useLongUuids;
            }
            const policyTableMakeFlow = flame.flow(makePolicyTable, {method: 'parallel', eventLoop: true});
            policyTableMakeFlow(function (err, data) {
                cacheData.appPolicies = data.appPolicies;
                cb(err, cacheData);
            });
        } else {
            if (returnPreview) {
                makePolicyTable.moduleConfig = setupModuleConfig(isProduction, useLongUuids);
                makePolicyTable.functionalGroups = setupFunctionalGroups(isProduction);
                makePolicyTable.consumerFriendlyMessages = setupConsumerFriendlyMessages(isProduction);
            }
            const policyTableMakeFlow = flame.flow(makePolicyTable, {method: 'parallel', eventLoop: true});
            policyTableMakeFlow(function (err, data) {
                cache.setCacheData(isProduction, app.locals.version, cache.policyTableKey, data);
                cb(err, data);
            });
        }
    });
}

function setupModuleConfig (isProduction, useLongUuids = false) {
    const getModuleConfig = {
        base: setupSqlCommand.bind(null, moduleConfigSql.moduleConfig.status(isProduction)),
        retrySeconds: setupSqlCommand.bind(null, moduleConfigSql.retrySeconds.status(isProduction))
    };
    const moduleConfigGetFlow = flame.flow(getModuleConfig, {method: 'parallel'});
    const makeModuleConfig = [
        moduleConfigGetFlow,
        model.transformModuleConfig.bind(null, isProduction, useLongUuids)
    ];
    return flame.flow(makeModuleConfig, {method: 'waterfall'});
}

function setupConsumerFriendlyMessages (isProduction) {
    const getMessages = flame.flow({
        messageStatuses: setupSqlCommand.bind(null, messagesSql.getMessages.status(isProduction)),
        messageGroups: setupSqlCommand.bind(null, messagesSql.getMessages.group(isProduction, false, true))
    }, {method: 'parallel'});

    const makeMessages = [
        getMessages,
        model.transformMessages
    ];

    return flame.flow(makeMessages, {method: 'waterfall'});
}

function setupFunctionalGroups (isProduction) {
    const getFunctionGroupInfo = {
        base: setupSqlCommand.bind(null, funcGroupSql.getFuncGroup.base.statusFilter(isProduction, true)),
        hmiLevels: setupSqlCommand.bind(null, funcGroupSql.getFuncGroup.hmiLevels.statusFilter(isProduction, true)),
        parameters: setupSqlCommand.bind(null, funcGroupSql.getFuncGroup.parameters.statusFilter(isProduction, true)),
        messageGroups: messages.getMessageGroups.bind(null, isProduction, true), //get consent prompt values (always returns a value as if in STAGING mode)
    };
    const funcGroupGetFlow = flame.flow(getFunctionGroupInfo, {method: 'parallel'});
    const makeFunctionGroupInfo = [
        funcGroupGetFlow,
        model.transformFunctionalGroups.bind(null, isProduction)
    ];
    return flame.flow(makeFunctionGroupInfo, {method: 'waterfall'});
}

function setupAppPolicies (isProduction, useLongUuids = false, reqAppPolicy) {
    const uuids = Object.keys(reqAppPolicy);
    let getAppPolicy = [];
    if (uuids.length) {
        getAppPolicy.push(setupSqlCommand.bind(null, sql.getBaseAppInfo(isProduction, useLongUuids, uuids)));
    }
    else {
        getAppPolicy.push(function (callback) {
            callback(null, []);
        });
    }
    getAppPolicy.push(mapAppBaseInfo.bind(null, isProduction, useLongUuids, uuids));
    return flame.flow(getAppPolicy, {method: 'waterfall'});
}

function mapAppBaseInfo (isProduction, useLongUuids = false, requestedUuids, appObjs, callback) {
    const makeAppPolicyFlow = flame.flow(flame.map(appObjs, function (appObj, next) {
        const getInfoFlow = flame.flow({
            displayNames: setupSqlCommand.bind(null, sql.getAppDisplayNames(appObj.id)),
            moduleNames: setupSqlCommand.bind(null, sql.getAppModules(appObj.id)),
            funcGroupNames: setupSqlCommand.bind(null, sql.getAppFunctionalGroups(isProduction, appObj)),
        }, {method: 'parallel'});

        flame.flow([
            getInfoFlow,
            model.constructAppPolicy.bind(null, appObj, useLongUuids)
        ], {method: 'waterfall'})(next); //run it
    }), {method: 'parallel'});

    const getAllDataFlow = flame.flow({
        policyObjs: makeAppPolicyFlow,
        requestedUuids: function(callback){
            callback(null, requestedUuids);
        },
        useLongUuids: function(callback){
            callback(null, useLongUuids);
        },
        defaultFuncGroups: setupSqlCommand.bind(null, sql.getDefaultFunctionalGroups(isProduction)),
        preDataConsentFuncGroups: setupSqlCommand.bind(null, sql.getPreDataConsentFunctionalGroups(isProduction)),
        deviceFuncGroups: setupSqlCommand.bind(null, sql.getDeviceFunctionalGroups(isProduction)),
        blacklistedApps: function (callback) {
            if (requestedUuids.length > 0) {
                setupSqlCommand(sqlApps.getBlacklistedApps(requestedUuids, useLongUuids), callback);
            } else {
                callback(null, []);
            }
        }
    }, {method: 'parallel'});
    flame.flow([
        getAllDataFlow,
        model.aggregateResults
    ], {method: 'waterfall'})(callback);
}

module.exports = {
    validateCorePost: validateCorePost,
    validateAppPolicyOnlyPost: validateAppPolicyOnlyPost,
    generatePolicyTable: generatePolicyTable
}
