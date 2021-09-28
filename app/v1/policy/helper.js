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
const vehicleDataSql = require('../vehicle-data/sql.js');
const cache = require('../../../custom/cache');
const GET = require('lodash').get;

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
async function generatePolicyTable (isProduction, useLongUuids = false, appPolicyObj, returnPreview) {
    const start = Date.now();

    let cacheNewData = false;
    let policyTable = await cache.getCacheData(isProduction, app.locals.version, cache.policyTableKey);
    if (!policyTable) {
        policyTable = {};
    }

    if (appPolicyObj) { //existence of appPolicyObj implies to return the app policy object
        policyTable.appPolicies = setupAppPolicies(isProduction, useLongUuids, appPolicyObj);
    }

    if (GET(policyTable, "moduleConfig")
    && GET(policyTable, "functionalGroups")
    && GET(policyTable, "consumerFriendlyMessages")
    && GET(policyTable, "vehicleData")) {
        if(policyTable.moduleConfig){
            policyTable.moduleConfig.full_app_id_supported = useLongUuids;
        }
    } else {
        cacheNewData = true;
        if (returnPreview) {
            policyTable.moduleConfig = setupModuleConfig(isProduction, useLongUuids);
            policyTable.functionalGroups = setupFunctionalGroups(isProduction);
            policyTable.consumerFriendlyMessages = setupConsumerFriendlyMessages(isProduction);
            policyTable.vehicleData = setupVehicleData(isProduction);
        }
    }

    for (let prop in policyTable) {
        policyTable[prop] = await policyTable[prop]; // resolve all promises into each property
    }

    if (cacheNewData) {
        cache.setCacheData(isProduction, app.locals.version, cache.policyTableKey, policyTable);
    }

    return policyTable;
}

async function setupVehicleData (isProduction) {
    const data = {
        schemaVersion: app.locals.db.asyncSql(sql.getVehicleDataSchemaVersion(isProduction)),
        rawCustomVehicleData: app.locals.db.asyncSql(vehicleDataSql.getVehicleData(isProduction)),
        rawRpcSpecParams: app.locals.db.asyncSql(sql.getRpcSpecParams()),
        rawRpcSpecTypes: app.locals.db.asyncSql(sql.getRpcSpecTypes()),
    };

    for (let prop in data) {
        data[prop] = await data[prop]; // resolve all promises into each property
    }

    return await model.transformVehicleData(isProduction, data);
}

async function setupModuleConfig (isProduction, useLongUuids = false) {
    const moduleConfigData = {
        base: app.locals.db.asyncSql(moduleConfigSql.moduleConfig.status(isProduction)),
        retrySeconds: app.locals.db.asyncSql(moduleConfigSql.retrySeconds.status(isProduction)),
        endpointProperties: app.locals.db.asyncSql(moduleConfigSql.endpointProperties.status(isProduction)),
    };

    for (let prop in moduleConfigData) {
        moduleConfigData[prop] = await moduleConfigData[prop]; // resolve all promises into each property
    }

    return await model.transformModuleConfig(isProduction, useLongUuids, moduleConfigData);
}

async function setupConsumerFriendlyMessages (isProduction) {
    const messagesData = {
        messageStatuses: app.locals.db.asyncSql(messagesSql.getMessages.status(isProduction)),
        messageGroups: app.locals.db.asyncSql(messagesSql.getMessages.group(isProduction, false, true)),
        highestMessageGroupId: app.locals.db.asyncSql(messagesSql.getMessages.highestGroupId(isProduction, false))
    };

    for (let prop in messagesData) {
        messagesData[prop] = await messagesData[prop]; // resolve all promises into each property
    }

    return await model.transformMessages(messagesData);
}

async function setupFunctionalGroups (isProduction) {
    const functionGroupInfo = {
        base: app.locals.db.asyncSql(funcGroupSql.getFuncGroup.base.statusFilter(isProduction, true)),
        hmiLevels: app.locals.db.asyncSql(funcGroupSql.getFuncGroup.hmiLevels.statusFilter(isProduction, true)),
        parameters: app.locals.db.asyncSql(funcGroupSql.getFuncGroup.parameters.statusFilter(isProduction, true)),
        messageGroups: messages.getMessageGroups(isProduction, true), //get consent prompt values (always returns a value as if in STAGING mode)
    };

    for (let prop in functionGroupInfo) {
        functionGroupInfo[prop] = await functionGroupInfo[prop]; // resolve all promises into each property
    }

    return await model.transformFunctionalGroups(isProduction, functionGroupInfo);
}

async function setupAppPolicies (isProduction, useLongUuids = false, reqAppPolicy) {
    const uuids = Object.keys(reqAppPolicy);
    let appObjs = [];
    if (uuids.length) {
        appObjs = await app.locals.db.asyncSql(sql.getBaseAppInfo(isProduction, useLongUuids, uuids));
    }

    return await mapAppBaseInfo(isProduction, useLongUuids, uuids, reqAppPolicy, appObjs);
}

async function mapAppBaseInfo (isProduction, useLongUuids = false, requestedUuids, incomingAppObjs, appObjs) {
    const appObjPromises = appObjs.map(async appObj => {
        const promiseObjects = { // start all promises in parallel
            categories: app.locals.db.asyncSql(sqlApps.getAppCategoriesNames(appObj.id)),
            displayNames: app.locals.db.asyncSql(sql.getAppDisplayNames(appObj.id)),
            moduleNames: app.locals.db.asyncSql(sql.getAppModules(appObj.id)),
            funcGroupNames: app.locals.db.asyncSql(sql.getAppFunctionalGroups(isProduction, appObj)),
            serviceTypes: app.locals.db.asyncSql(sqlApps.getApp.serviceTypes.idFilter(appObj.id)),
            serviceTypeNames: app.locals.db.asyncSql(sqlApps.getApp.serviceTypeNames.idFilter(appObj.id)),
            serviceTypePermissions: app.locals.db.asyncSql(sqlApps.getApp.serviceTypePermissions.idFilter(appObj.id)),
            hybridPreference: app.locals.db.asyncSql(sqlApps.getApp.hybridPreference.idFilter(appObj.id)),
            appPassthrough: app.locals.db.asyncSql(sqlApps.getApp.passthrough.idFilter(appObj.id)),
            incomingAppPolicy: Promise.resolve(incomingAppObjs[(useLongUuids ? appObj.app_uuid : appObj.app_short_uuid)])
        };

        for (let prop in promiseObjects) {
            promiseObjects[prop] = await promiseObjects[prop]; // resolve all promises into each property
        }

        return model.constructAppPolicy(appObj, useLongUuids, promiseObjects);
    });

    const appObjsResolved = await Promise.all(appObjPromises);

    const allDataPromises = { // start all promises in parallel
        policyObjs: appObjsResolved,
        requestedUuids: Promise.resolve(requestedUuids),
        useLongUuids: Promise.resolve(useLongUuids),
        defaultFuncGroups: app.locals.db.asyncSql(sql.getDefaultFunctionalGroups(isProduction)),
        preDataConsentFuncGroups: app.locals.db.asyncSql(sql.getPreDataConsentFunctionalGroups(isProduction)),
        deviceFuncGroups: app.locals.db.asyncSql(sql.getDeviceFunctionalGroups(isProduction)),
    };
    if (requestedUuids.length > 0) {
        allDataPromises.blacklistedApps = app.locals.db.asyncSql(sqlApps.getBlacklistedApps(requestedUuids, useLongUuids));
    } else {
        allDataPromises.blacklistedApps = Promise.resolve([]);
    }

    for (let prop in allDataPromises) {
        allDataPromises[prop] = await allDataPromises[prop]; // resolve all promises into each property
    }

    return model.aggregateResults(allDataPromises);
}

module.exports = {
    validateCorePost: validateCorePost,
    validateAppPolicyOnlyPost: validateAppPolicyOnlyPost,
    generatePolicyTable: generatePolicyTable
}
