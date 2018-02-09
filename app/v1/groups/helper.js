const check = require('check-types');
const model = require('./model.js');
const app = require('../app');
const messages = require('../messages/controller.js');
const flow = app.locals.flow;
const setupSql = app.locals.sql.setupSqlCommand;
const utils = require('../policy/utils.js');

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

//helper functions

function makeTemplateFlowStart () {
    const getTemplateInfo = flow([
        setupSql(app.locals.sql.rpcs),
        setupSql(app.locals.sql.permissionRelationsNoModules),
        setupSql(app.locals.sql.hmiLevels),
    ], {method: 'parallel'});

    return [
        getTemplateInfo,
        generateTemplate
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
                next(null, baseTemplate());
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
        model.makeFunctionGroups
    ], {method: 'waterfall'});
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

//modifies the original reference. sends the template back in an array
function arrayifyOneFuncGroup (template, next) {
    utils.arrayify(template, ['rpcs', null, 'hmi_levels']);
    utils.arrayify(template, ['rpcs', null, 'parameters']);
    utils.arrayify(template, ['rpcs']);
    next(null, [template]);
}

//generates a template response that can be used to describe any specific function group info
function generateTemplate (info, next) {
    const rpcs = info[0];
    const permissionRelations = info[1];
    const hmiLevels = info[2];

    let hmiLevelsHash = {};
    for (let i = 0; i < hmiLevels.length; i++) {
        hmiLevelsHash[hmiLevels[i].id] = {
            name: hmiLevels[i].id,
            value: hmiLevels[i].id,
            selected: false
        }
    }

    function transRelations (element) {
        return [
            element['parent_permission_name'],
            element['child_permission_name']
        ];
    }

    let template = baseTemplate();
    template.rpcs = {};

    const parameterRelations = hashedRelationsTransform(utils.hashify({}, permissionRelations, transRelations, null));

    for (let i = 0; i < rpcs.length; i++) {
        const rpc = rpcs[i];
        let obj = {
            name: rpc.name,
            hmi_levels: hmiLevelsHash,
            selected: false
        };
        if (parameterRelations[rpc.name]) {
            //the permission exists in the parent permissions
            obj.parameters = parameterRelations[rpc.name]
        }
        template.rpcs[rpc.name] = obj;      
    }

    //it's just as fast, if not faster, to setup the template, not worrying about storing references
    //in multiple places, and blasting them all out with parse/stringify. it's also safer.
    next(null, JSON.parse(JSON.stringify(template)));
}

function baseTemplate () {
    return {
        id: 0,
        name: "",
        description: "",
        status: "",
        selected_prompt_id: 0,
        selected_rpc_count: 0,
        selected_parameter_count: 0,
        is_default: false,
        is_deleted: false,
        user_consent_prompt: null
    };
}

function hashedRelationsTransform (relations) {
    let response = {};
    for (rpc in relations) {
        response[rpc] = {};
        for (parameter in relations[rpc]) {
            response[rpc][parameter] = {
                name: parameter,
                key: parameter,
                selected: false
            };
        }
    }
    return response;
}

module.exports = {
	makeTemplateFlowStart: makeTemplateFlowStart,
	createFuncGroupFlow: createFuncGroupFlow,
	getFunctionGroupDetailsSqlFlow: getFunctionGroupDetailsSqlFlow,
	validatePromote: validatePromote,
	validatePromptExistence: validatePromptExistence,
	validateFuncGroup: validateFuncGroup,
	arrayifyOneFuncGroup: arrayifyOneFuncGroup
}