const check = require('check-types');
const model = require('./model.js');
const app = require('../app');
const messages = require('../messages/controller.js');
const flow = app.locals.flow;
const flame = app.locals.flame;
const setupSql = app.locals.db.setupSqlCommand;
const sql = require('./sql.js');

//validation functions

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

    messages.getMessageGroups(false, true, function (err, categories) {
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

function validateFuncGroup (req, res, callback) {
    //base check
    if (!check.string(req.body.name) || !check.boolean(req.body.is_default) || !check.array(req.body.rpcs)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required for functional group: name, is_default, rpcs");
        return callback();
    }
    //rpcs check
    const rpcs = req.body.rpcs;
    flow(flame.map(rpcs, validateRpc), {method: 'parallel', eventLoop: true})(function (err, res) {
        callback();
    });
    
    function validateRpc (rpc, next) {
        //base check
        if (!check.string(rpc.name) || !check.array(rpc.hmi_levels)
            || !check.boolean(rpc.selected) || !check.array(rpc.parameters)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for RPC element: name, hmi_levels, parameters, selected");
                return next(true); //error out early
        }
        //hmi levels check
        for (let j = 0; j < rpc.hmi_levels.length; j++) {
            const levels = rpc.hmi_levels[j];
            if (!check.string(levels.value) || !check.boolean(levels.selected)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for HMI level: value, selected");
                return next(true); //error out early
            }
        }
        //parameters check
        for (let j = 0; j < rpc.parameters.length; j++) {
            const params = rpc.parameters[j];
            if (!check.string(params.key) || !check.boolean(params.selected)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for parameter: key, selected");
                return next(true); //error out early
            }
        }       
        next();
    } 
}

//helper functions

//only needs to be generated once, because the RPC list and permission relations cannot be changed after server start up
function generateFunctionGroupTemplates (callback) {
    const getTemplateInfo = flow({
        rpcs: setupSql.bind(null, sql.rpcs),
        permissionRelations: setupSql.bind(null, sql.permissionRelationsNoModules),
        hmiValues: setupSql.bind(null, sql.hmiLevels),
    }, {method: 'parallel'});

    const finalFlow = flow([
        getTemplateInfo,
        model.generateTemplate
    ], {method: 'waterfall'});

    finalFlow(callback);
}

//helper function that allows retrieving functional group info easily
function createFuncGroupFlow (filterTypeProp, value, includeRpcs, isProduction) {
    const getAllInfoFlow = flow({
        base: setupSql.bind(null, sql.getFuncGroup.base[filterTypeProp](value)),
        hmiLevels: setupSql.bind(null, sql.getFuncGroup.hmiLevels[filterTypeProp](value)),
        parameters: setupSql.bind(null, sql.getFuncGroup.parameters[filterTypeProp](value)),
        messageGroups: messages.getMessageGroups.bind(null, isProduction, false), //get consent prompt values
    }, {method: 'parallel'});

    return flow([
        getAllInfoFlow,
        model.makeFunctionGroups.bind(null, includeRpcs)
    ], {method: 'waterfall', eventLoop: true});
}

function getGroupNamesStaging (callback) {
    setupSql(sql.getGroupNamesStaging, function (err, names) {
        callback(err, names.map(function (elem) {return elem.property_name;}));
    });
}

module.exports = {
	createFuncGroupFlow: createFuncGroupFlow,
	validatePromote: validatePromote,
	validatePromptExistence: validatePromptExistence,
	validateFuncGroup: validateFuncGroup,
    getGroupNamesStaging: getGroupNamesStaging,
    generateFunctionGroupTemplates: generateFunctionGroupTemplates
}