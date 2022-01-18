const check = require('check-types');
const model = require('./model.js');
const app = require('../app');
const messages = require('../messages/controller.js');
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
async function validatePromptExistence (isProduction, req, res) {
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
        return; //stop here
    }

    const categories = await messages.getMessageGroups(false, true);
    const category = categories.find(function (category) {
        return category.message_category === consentPrompt;
    });
    if (!category) {
        res.parcel
            .setStatus(400)
            .setMessage("The user consent prompt does not exist under this environment: " + consentPrompt);
    }
}

function validateFuncGroup (req, res) {
    //base check
    if (!check.string(req.body.name) || req.body.name === '' || !check.boolean(req.body.is_default) || !check.array(req.body.rpcs)) {
        res.parcel
            .setStatus(400)
            .setMessage("Required for functional group: name, is_default, rpcs");
        return;
    }
    //rpcs check
    const rpcs = req.body.rpcs;
    rpcs.map(validateRpc);

    function validateRpc (rpc) {
        //base check
        if (!check.string(rpc.name) || !check.array(rpc.hmi_levels)
            || !check.boolean(rpc.selected) || !check.array(rpc.parameters)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for RPC element: name, hmi_levels, parameters, selected");
                return true; //error out early
        }
        //hmi levels check
        for (let j = 0; j < rpc.hmi_levels.length; j++) {
            const levels = rpc.hmi_levels[j];
            if (!check.string(levels.value) || !check.boolean(levels.selected)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for HMI level: value, selected");
                return true; //error out early
            }
        }
        //parameters check
        for (let j = 0; j < rpc.parameters.length; j++) {
            const params = rpc.parameters[j];
            if (!check.string(params.key) || !check.boolean(params.selected)) {
                res.parcel
                    .setStatus(400)
                    .setMessage("Required for parameter: key, selected");
                return true; //error out early
            }
        }
    }
}

//helper functions

//only needs to be generated once, because the RPC list and permission relations cannot be changed after server start up
async function generateFunctionGroupTemplates (isProduction = false) {
    const info = {
        rpcs: app.locals.db.asyncSql(sql.rpcs),
        permissionRelations: app.locals.db.asyncSql(sql.permissionRelationsNoModules(isProduction)),
        hmiValues: app.locals.db.asyncSql(sql.hmiLevels),
    };

    for (let prop in info) {
        info[prop] = await info[prop]; // resolve all promises into each property
    }

    return await model.generateTemplate(info);
}

//helper function that allows retrieving functional group info easily
async function createFuncGroupFlow (filterTypeProp, value, includeRpcs, isProduction) {
    const info = {
        base: app.locals.db.asyncSql(sql.getFuncGroup.base[filterTypeProp](value)),
        hmiLevels: app.locals.db.asyncSql(sql.getFuncGroup.hmiLevels[filterTypeProp](value)),
        parameters: app.locals.db.asyncSql(sql.getFuncGroup.parameters[filterTypeProp](value)),
        messageGroups: messages.getMessageGroups(isProduction, false), //get consent prompt values
    };

    for (let prop in info) {
        info[prop] = await info[prop]; // resolve all promises into each property
    }

    return await model.makeFunctionGroups(includeRpcs, isProduction, info);
}

async function getGroupNamesStaging () {
    const names = await app.locals.db.asyncSql(sql.getGroupNamesStaging);
    return names.map(elem => elem.property_name);
}

module.exports = {
    createFuncGroupFlow: createFuncGroupFlow,
    validatePromote: validatePromote,
    validatePromptExistence: validatePromptExistence,
    validateFuncGroup: validateFuncGroup,
    getGroupNamesStaging: getGroupNamesStaging,
    generateFunctionGroupTemplates: generateFunctionGroupTemplates
}