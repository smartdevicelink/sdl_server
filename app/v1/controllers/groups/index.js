//this file is a beautiful mess
const app = require('../../app');
const flow = app.locals.flow;
const setupSql = app.locals.sql.setupSqlCommand;
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;
const setupSqlCommands = app.locals.sql.setupSqlCommands;
const funcGroup = require('./funcGroup.js');
const messages = require('../messages/index.js');
const check = require('check-types');


//let flowex = createFuncGroupFlow('idFilter', 5, true);
//let flowex = createFuncGroupFlow('statusFilter', true, false);
// let flowex = makeTemplateFlowStart();
// flowex.push(funcGroup.arrayifyOneFuncGroup);
// flowex = flow(flowex, {method: 'waterfall'});

//flowex(function (err, res) {
    //console.log(JSON.stringify(res, null, 4));
    //console.log(res);
//});

function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment && req.query.environment.toLowerCase() === 'staging' ? false: true;
    const returnTemplate = !!req.query.template; //coerce to boolean

    let chosenFlow; //to be determined

    if (returnTemplate) { //template mode. return just the shell of a functional group
        chosenFlow = makeTemplateFlowStart();
        chosenFlow.push(funcGroup.arrayifyOneFuncGroup);
        chosenFlow = flow(chosenFlow, {method: 'waterfall'});
    }
    else if (req.query.id) { //filter by id
        chosenFlow = createFuncGroupFlow('idFilter', req.query.id, true);
    }
    else { //get all apps at the high level, filtering in PRODUCTION or STAGING mode
        chosenFlow = createFuncGroupFlow('statusFilter', isProduction, false);
    }

    chosenFlow(function (err, groups) {
        if (err) {
            app.locals.log.error(err);
            return res.parcel
                .setStatus(500)
                .setMessage("Internal server error")
                .deliver();
        }
        return res.parcel
            .setStatus(200)
            .setData({
                "groups": groups
            })
            .deliver();
    });
}

function makeTemplateFlowStart () {
    const getTemplateInfo = flow([
        setupSql(app.locals.sql.rpcs),
        setupSql(app.locals.sql.permissionRelationsNoModules),
        setupSql(app.locals.sql.hmiLevels),
    ], {method: 'parallel'});

    return [
        getTemplateInfo,
        funcGroup.generateTemplate
    ];
}

//helper function that allows retrieving functional group info easily
function createFuncGroupFlow (filterTypeProp, value, includeRpcs) {
    let makeTemplateArray;
    if (includeRpcs) {
        makeTemplateArray = makeTemplateFlowStart();
    }
    else { //no rpcs included means no extra template information is needed
        makeTemplateArray = [
            function (next) {
                next(null, funcGroup.baseTemplate());
            }
        ];
    }
    const makeTemplateFlow = flow(makeTemplateArray, {method: 'waterfall'});

    const getFuncGroupFlow = flow([
        setupSql(app.locals.sql.getFuncGroup.base[filterTypeProp](value)),
        setupSql(app.locals.sql.getFuncGroup.hmiLevels[filterTypeProp](value)),
        setupSql(app.locals.sql.getFuncGroup.parameters[filterTypeProp](value)),
        messages.getMessageGroups.bind(null, false) //get consent prompt values (always returns a value as if in STAGING mode)
    ], {method: 'parallel'});

    const getAllInfoFlow = flow([
        getFuncGroupFlow,
        makeTemplateFlow
    ], {method: 'parallel'});

    return flow([
        getAllInfoFlow,
        funcGroup.makeFunctionGroups
    ], {method: 'waterfall'});
}

function postStaging (req, res, next) {
    validateFuncGroup(req, res);
    if (res.parcel.message) {
        res.parcel.deliver();
        return;
    }
    //check in staging mode
    validatePromptExistence(false, req, res, function () {
        if (res.parcel.message) {
            res.parcel.deliver();
            return;
        }
        //convert the JSON to sql-like statements
        const funcGroupSqlObj = funcGroup.convertFuncGroupJson(req.body);
        //force function group status to STAGING
        funcGroup.insertFuncGroupSql(false, funcGroupSqlObj, function () {
            res.parcel
                .setStatus(200)
                .deliver();
        });
    });
}

// //TODO: replace this with insertFuncGroupSql
// function addFuncGroupFlow (funcGroupObj, isProduction) {
//     const funcGroupSqlObj = funcGroup.convertFuncGroupJson(funcGroupObj, isProduction);

//     const insertFuncMiscFlow = flow([
//         flow(setupInsertsSql(app.locals.sql.insert.funcHmiLevels(funcGroupSqlObj[1])), {method: 'parallel'}), //hmi levels
//         flow(setupInsertsSql(app.locals.sql.insert.funcParameters(funcGroupSqlObj[2])), {method: 'parallel'}) //parameters
//     ], {method: 'parallel'});

//     return flow([
//         flow(setupInsertsSql(app.locals.sql.insert.funcGroupInfo(funcGroupSqlObj[0])), {method: 'parallel'}), //base info
//         insertFuncMiscFlow
//     ], {method: 'series'});
// }

function promoteIds (req, res, next) {
    validatePromote(req, res);
    if (res.parcel.message) {
        return res.parcel.deliver();
    }
    //make sure the data in id is an array in the end
    if (check.number(req.body.id)) {
        req.body.id = [req.body.id];
    }
    //TODO: check prompt existence in production mode
    //get function group information first so prompt existence checks can be attempted

    const getAndInsertFlow = app.locals.flow([
        getFunctionGroupDetailsSqlFlow(req.body.id),
        funcGroup.insertFuncGroupSql.bind(null, true) //force group status to PRODUCTION
    ], {method: 'waterfall'});

    getAndInsertFlow(function () {
        res.parcel
            .setStatus(200)
            .deliver(); //done
    });
}

//for an array of ids. filters out PRODUCTION records. meant solely for the promotion route
//doesn't make an object out of the data
function getFunctionGroupDetailsSqlFlow (ids) {
    return app.locals.flow([
        setupSql(app.locals.sql.getFuncGroup.base.ids(ids)),
        setupSql(app.locals.sql.getFuncGroup.hmiLevels.ids(ids)),
        setupSql(app.locals.sql.getFuncGroup.parameters.ids(ids))
    ], {method: 'parallel'});
}

function validatePromote (req, res) {
    if (!check.array(req.body.id) && !check.number(req.body.id)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required: id (array) or id (number)");
    }
    return;
}

//NOTE: this will not warn the user if a change is made in a consumer friendly message in STAGING
//such that the STAGING value will be returned in staging mode but in PRODUCTION mode the older value gets used
function validatePromptExistence (isProduction, req, res, cb) {
    //find if the consentPrompt of this functional group exists in the context
    //of the target environment
    //if user_consent_prompt is an empty string, then also treat it as valid, but convert it into null
    //for insertion into the database
    if (req.body.user_consent_prompt === "") {
        req.body.user_consent_prompt = null;
    }
    const consentPrompt = req.body.user_consent_prompt;

    //if user_consent_prompt is null, then there is no prompt, which is a valid option
    if (consentPrompt === null) {
        return cb(); //stop here
    }

    messages.getMessageGroups(false, function (err, categories) {
        const category = categories.find(function (category) {
            return category.message_category === consentPrompt;
        });
        if (!category) {
            res.parcel
                .setStatus(400)
                .setMessage("The user consent prompt does not exist under this environment: " + consentPrompt);
        }
        cb(); //done
    });
}

function validateFuncGroup (req, res) {
    //base check
    if (!check.string(req.body.name) || !check.boolean(req.body.is_default) || !check.array(req.body.rpcs)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required for functional group: name, is_default, rpcs");
        return;
    }
    //rpcs check
    const rpcs = req.body.rpcs;
    for (let i = 0; i < rpcs.length; i++) {
        //base check
        if (!check.string(rpcs[i].name) || !check.array(rpcs[i].hmi_levels)
            || !check.boolean(rpcs[i].selected) || !check.array(rpcs[i].parameters)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for RPC element: name, hmi_levels, parameters, selected");
                return;
        }
        //hmi levels check
        for (let j = 0; j < rpcs[i].hmi_levels.length; j++) {
            const levels = rpcs[i].hmi_levels[j];
            if (!check.string(levels.value) || !check.boolean(levels.selected)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for HMI level: value, selected");
                return;
            }
        }
        //parameters check
        for (let j = 0; j < rpcs[i].parameters.length; j++) {
            const params = rpcs[i].parameters[j];
            if (!check.string(params.key) || !check.boolean(params.selected)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for parameter: key, selected");
                return;
            }
        }
    }
}

function validateDelete (req, res) {
    if (!check.number(req.body.id)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required for deletion: id");
    }
    return;
}

module.exports = {
    get: get,
    postAddGroup: postStaging,
    postPromote: promoteIds
};