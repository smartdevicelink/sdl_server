//this file is a beautiful mess
const app = require('../../app');
const flow = app.locals.flow;
const setupSql = app.locals.sql.setupSqlCommand;
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;
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
            return res.sendStatus(500);
        }
        return res.status(200).send({groups: groups});
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
        messages.getMessageCategories.bind(null, false) //get consent prompt values (always returns a value as if in STAGING mode)
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

function post (isProduction) {
    return function (req, res, next) {
        validateFuncGroup(req, res);
        if (res.errorMsg) {
            return res.status(400).send({ error: res.errorMsg });
        }
        validatePromptExistence(isProduction, req, res, function () {
            if (res.errorMsg) {
                return res.status(400).send({ error: res.errorMsg });
            }        
            //for an edit, the new func group should be in STAGING
            //for a promote, the new func group should be in PRODUCTION
            addFuncGroupFlow(req.body, isProduction)(function () {
                res.sendStatus(200);
            });
        });        
    }
}

//NOTE: this will not warn the user if a change is made in a consumer friendly message in STAGING
//such that the STAGING value will be returned in staging mode but in PRODUCTION mode the older value gets used
function validatePromptExistence (isProduction, req, res, cb) {
    const consentPrompt = req.body.user_consent_prompt;
    //find if the consentPrompt of this functional group exists in the context
    //of the target environment
    //if user_consent_prompt is null, then there is no prompt, which is a valid option
    if (consentPrompt === null) {
        return cb(); //stop here
    }

    messages.getMessageCategories(false, function (err, categories) {
        const category = categories.find(function (category) {
            return category.message_category === consentPrompt;
        });
        if (!category) {
            res.errorMsg = "The user consent prompt does not exist under this environment: " + consentPrompt;
        }
        cb(); //done
    });    
}

function addFuncGroupFlow (funcGroupObj, isProduction) {
    const funcGroupSqlObj = funcGroup.convertFuncGroupJson(funcGroupObj, isProduction);

    const insertFuncMiscFlow = flow([
        flow(setupInsertsSql(app.locals.sql.insert.funcHmiLevels(funcGroupSqlObj[1])), {method: 'parallel'}), //hmi levels
        flow(setupInsertsSql(app.locals.sql.insert.funcParameters(funcGroupSqlObj[2])), {method: 'parallel'}) //parameters
    ], {method: 'parallel'});

    return flow([
        flow(setupInsertsSql(app.locals.sql.insert.funcGroupInfo(funcGroupSqlObj[0])), {method: 'parallel'}), //base info 
        insertFuncMiscFlow
    ], {method: 'series'});
}

function validateFuncGroup (req, res) {
    //base check
    if (!check.string(req.body.name) || !check.boolean(req.body.is_default) || !check.array(req.body.rpcs)) {
        return res.errorMsg = "Required for functional group: name, is_default, rpcs";
    }
    //rpcs check
    const rpcs = req.body.rpcs;
    for (let i = 0; i < rpcs.length; i++) {
        //base check
        if (!check.string(rpcs[i].name) || !check.array(rpcs[i].hmi_levels) 
            || !check.boolean(rpcs[i].selected) || !check.array(rpcs[i].parameters)) {
            return res.errorMsg = "Required for RPC element: name, hmi_levels, parameters, selected";
        }
        //hmi levels check
        for (let j = 0; j < rpcs[i].hmi_levels.length; j++) {
            const levels = rpcs[i].hmi_levels[j];
            if (!check.string(levels.value) || !check.boolean(levels.selected)) {
                return res.errorMsg = "Required for HMI level: value, selected";
            }
        }
        //parameters check
        for (let j = 0; j < rpcs[i].parameters.length; j++) {
            const params = rpcs[i].parameters[j];
            if (!check.string(params.key) || !check.boolean(params.selected)) {
                return res.errorMsg = "Required for parameter: key, selected";
            }
        }
    }
}

function validateDelete (req, res) {
    if (!check.number(req.body.id)) {
        return res.errorMsg = "Required for deletion: id";
    }
}

module.exports = {
    get: get,
    postAddGroup: post(false),
    postPromote: post(true)
};