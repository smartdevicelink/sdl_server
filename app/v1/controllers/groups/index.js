const app = require('../../app');
const flow = app.locals.flow;
const setupSql = app.locals.sql.setupSqlCommand;
const setupInsertsSql = app.locals.sql.setupSqlInsertsNoError;
const funcGroup = require('./funcGroup.js');
const messages = require('../messages/index.js');
const check = require('check-types');


//const flowex = createFuncGroupFlow('idFilter', 5, true);
const flowex = createFuncGroupFlow('statusFilter', true, false);
flowex(function (err, res) {
    console.log(JSON.stringify(res, null, 4));
    //console.log(res);
});


function get (req, res, next) {
    //if environment is not of value "staging", then set the environment to production
    const isProduction = req.query.environment === 'staging' ? false: true;
    let chosenFlow; //to be determined

    if (req.query.id) { //filter by id
        chosenFlow = createFuncGroupFlow('idFilter', req.query.id, true);
    }
    else { //filter in PRODUCTION or STAGING mode
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

//helper function that allows retrieving functional group info easily
function createFuncGroupFlow (filterTypeFunc, value, includeRpcs) {
    const getTemplateInfo = flow([
        setupSql(app.locals.sql.rpcs),
        setupSql(app.locals.sql.permissionRelationsNoModules),
        setupSql(app.locals.sql.hmiLevels),
    ], {method: 'parallel'});

    let makeTemplateArray;
    if (includeRpcs) {
        makeTemplateArray = [
            getTemplateInfo,
            funcGroup.generateTemplate
        ];
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
        setupSql(app.locals.sql.getFuncGroup.base[filterTypeFunc](value)),
        setupSql(app.locals.sql.getFuncGroup.hmiLevels[filterTypeFunc](value)),
        setupSql(app.locals.sql.getFuncGroup.parameters[filterTypeFunc](value)),
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
//such that the STAGING value will be returned in staging mode but in PRODCUTION mode the older value gets used
function validatePromptExistence (isProduction, req, res, cb) {
    const consentPrompt = req.body.user_consent_prompt;
    //find if the consentPrompt of this functional group exists in the context
    //of the target environment
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

function del (req, res, next) {
    validateDelete(req, res);
    if (res.errorMsg) {
        return res.status(400).send({ error: res.errorMsg });
    }
    const deleteFlow = flow([
        setupSql(app.locals.sql.delete.funcGroup(2))
    ], {method: 'series'});

    deleteFlow(function () {
        res.sendStatus(200);
    });
}

function validateDelete (req, res) {
    if (!check.number(req.body.id)) {
        return res.errorMsg = "Required for deletion: id";
    }
}

const TEST = {
    "id": 5,
    "name": "VehicleInfo-3",
    "description": null,
    "status": "PRODUCTION",
    "selected_prompt_id": 0,
    "selected_rpc_count": 4,
    "selected_parameter_count": 12,
    "rpcs": [
        {
            "name": "ShowConstantTBT",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "AddCommand",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "Alert",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "ButtonPress",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "ChangeRegistration",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "DeleteFile",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "DeleteSubMenu",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "GetDTCs",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "GetInteriorVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "GetSystemCapability",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "GetVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": true
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": true
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": true
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": true,
            "parameters": [
                {
                    "name": "accPedalPosition",
                    "key": "accPedalPosition",
                    "selected": false
                },
                {
                    "name": "driverBraking",
                    "key": "driverBraking",
                    "selected": false
                },
                {
                    "name": "myKey",
                    "key": "myKey",
                    "selected": false
                },
                {
                    "name": "rpm",
                    "key": "rpm",
                    "selected": false
                },
                {
                    "name": "beltStatus",
                    "key": "beltStatus",
                    "selected": false
                },
                {
                    "name": "steeringWheelAngle",
                    "key": "steeringWheelAngle",
                    "selected": false
                },
                {
                    "name": "prndl",
                    "key": "prndl",
                    "selected": false
                },
                {
                    "name": "airbagStatus",
                    "key": "airbagStatus",
                    "selected": false
                },
                {
                    "name": "clusterModeStatus",
                    "key": "clusterModeStatus",
                    "selected": false
                },
                {
                    "name": "eCallInfo",
                    "key": "eCallInfo",
                    "selected": false
                },
                {
                    "name": "emergencyEvent",
                    "key": "emergencyEvent",
                    "selected": false
                },
                {
                    "name": "gps",
                    "key": "gps",
                    "selected": false
                },
                {
                    "name": "speed",
                    "key": "speed",
                    "selected": false
                },
                {
                    "name": "bodyInformation",
                    "key": "bodyInformation",
                    "selected": true
                },
                {
                    "name": "deviceStatus",
                    "key": "deviceStatus",
                    "selected": true
                },
                {
                    "name": "engineTorque",
                    "key": "engineTorque",
                    "selected": true
                },
                {
                    "name": "externalTemperature",
                    "key": "externalTemperature",
                    "selected": true
                },
                {
                    "name": "fuelLevel",
                    "key": "fuelLevel",
                    "selected": true
                },
                {
                    "name": "fuelLevel_State",
                    "key": "fuelLevel_State",
                    "selected": true
                },
                {
                    "name": "headLampStatus",
                    "key": "headLampStatus",
                    "selected": true
                },
                {
                    "name": "instantFuelConsumption",
                    "key": "instantFuelConsumption",
                    "selected": true
                },
                {
                    "name": "odometer",
                    "key": "odometer",
                    "selected": true
                },
                {
                    "name": "tirePressure",
                    "key": "tirePressure",
                    "selected": true
                },
                {
                    "name": "vin",
                    "key": "vin",
                    "selected": true
                },
                {
                    "name": "wiperStatus",
                    "key": "wiperStatus",
                    "selected": true
                }
            ]
        },
        {
            "name": "OnAppInterfaceUnregistered",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnAudioPassThru",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnButtonEvent",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnDriverDistraction",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnInteriorVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnKeyboardInput",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnLanguageChange",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnSystemRequest",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": true
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": true
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": true
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": true,
            "parameters": [
                {
                    "name": "accPedalPosition",
                    "key": "accPedalPosition",
                    "selected": false
                },
                {
                    "name": "driverBraking",
                    "key": "driverBraking",
                    "selected": false
                },
                {
                    "name": "myKey",
                    "key": "myKey",
                    "selected": false
                },
                {
                    "name": "rpm",
                    "key": "rpm",
                    "selected": false
                },
                {
                    "name": "beltStatus",
                    "key": "beltStatus",
                    "selected": false
                },
                {
                    "name": "steeringWheelAngle",
                    "key": "steeringWheelAngle",
                    "selected": false
                },
                {
                    "name": "prndl",
                    "key": "prndl",
                    "selected": false
                },
                {
                    "name": "airbagStatus",
                    "key": "airbagStatus",
                    "selected": false
                },
                {
                    "name": "eCallInfo",
                    "key": "eCallInfo",
                    "selected": false
                },
                {
                    "name": "clusterModeStatus",
                    "key": "clusterModeStatus",
                    "selected": false
                },
                {
                    "name": "emergencyEvent",
                    "key": "emergencyEvent",
                    "selected": false
                },
                {
                    "name": "gps",
                    "key": "gps",
                    "selected": false
                },
                {
                    "name": "speed",
                    "key": "speed",
                    "selected": false
                },
                {
                    "name": "bodyInformation",
                    "key": "bodyInformation",
                    "selected": true
                },
                {
                    "name": "deviceStatus",
                    "key": "deviceStatus",
                    "selected": true
                },
                {
                    "name": "engineTorque",
                    "key": "engineTorque",
                    "selected": true
                },
                {
                    "name": "externalTemperature",
                    "key": "externalTemperature",
                    "selected": true
                },
                {
                    "name": "fuelLevel",
                    "key": "fuelLevel",
                    "selected": true
                },
                {
                    "name": "fuelLevel_State",
                    "key": "fuelLevel_State",
                    "selected": true
                },
                {
                    "name": "headLampStatus",
                    "key": "headLampStatus",
                    "selected": true
                },
                {
                    "name": "instantFuelConsumption",
                    "key": "instantFuelConsumption",
                    "selected": true
                },
                {
                    "name": "odometer",
                    "key": "odometer",
                    "selected": true
                },
                {
                    "name": "tirePressure",
                    "key": "tirePressure",
                    "selected": true
                },
                {
                    "name": "wiperStatus",
                    "key": "wiperStatus",
                    "selected": true
                },
                {
                    "selected": true
                }
            ]
        },
        {
            "name": "OnWayPointChange",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "PerformAudioPassThru",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "ReadDID",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "RegisterAppInterface",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SendLocation",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SetAppIcon",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SetDisplayLayout",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SetMediaClockTimer",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "Speak",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SubscribeButton",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SubscribeVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": true
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": true
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": true
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": true,
            "parameters": [
                {
                    "name": "accPedalPosition",
                    "key": "accPedalPosition",
                    "selected": false
                },
                {
                    "name": "driverBraking",
                    "key": "driverBraking",
                    "selected": false
                },
                {
                    "name": "myKey",
                    "key": "myKey",
                    "selected": false
                },
                {
                    "name": "rpm",
                    "key": "rpm",
                    "selected": false
                },
                {
                    "name": "beltStatus",
                    "key": "beltStatus",
                    "selected": false
                },
                {
                    "name": "steeringWheelAngle",
                    "key": "steeringWheelAngle",
                    "selected": false
                },
                {
                    "name": "prndl",
                    "key": "prndl",
                    "selected": false
                },
                {
                    "name": "airbagStatus",
                    "key": "airbagStatus",
                    "selected": false
                },
                {
                    "name": "clusterModeStatus",
                    "key": "clusterModeStatus",
                    "selected": false
                },
                {
                    "name": "eCallInfo",
                    "key": "eCallInfo",
                    "selected": false
                },
                {
                    "name": "emergencyEvent",
                    "key": "emergencyEvent",
                    "selected": false
                },
                {
                    "name": "gps",
                    "key": "gps",
                    "selected": false
                },
                {
                    "name": "speed",
                    "key": "speed",
                    "selected": false
                },
                {
                    "name": "bodyInformation",
                    "key": "bodyInformation",
                    "selected": true
                },
                {
                    "name": "deviceStatus",
                    "key": "deviceStatus",
                    "selected": true
                },
                {
                    "name": "engineTorque",
                    "key": "engineTorque",
                    "selected": true
                },
                {
                    "name": "externalTemperature",
                    "key": "externalTemperature",
                    "selected": true
                },
                {
                    "name": "fuelLevel",
                    "key": "fuelLevel",
                    "selected": true
                },
                {
                    "name": "fuelLevel_State",
                    "key": "fuelLevel_State",
                    "selected": true
                },
                {
                    "name": "headLampStatus",
                    "key": "headLampStatus",
                    "selected": true
                },
                {
                    "name": "instantFuelConsumption",
                    "key": "instantFuelConsumption",
                    "selected": true
                },
                {
                    "name": "odometer",
                    "key": "odometer",
                    "selected": true
                },
                {
                    "name": "tirePressure",
                    "key": "tirePressure",
                    "selected": true
                },
                {
                    "name": "wiperStatus",
                    "key": "wiperStatus",
                    "selected": true
                }
            ]
        },
        {
            "name": "SystemRequest",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "UnsubscribeWayPoints",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "AlertManeuver",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "DialNumber",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "AddSubMenu",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "CreateInteractionChoiceSet",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "DeleteInteractionChoiceSet",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "EncodedSyncPData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "EndAudioPassThru",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "GetWayPoints",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnButtonPress",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnHashChange",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnEncodedSyncPData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnPermissionsChange",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnTBTClientState",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "PerformInteraction",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "ResetGlobalProperties",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "ScrollableMessage",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SetGlobalProperties",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "Show",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SubscribeWayPoints",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "UnregisterAppInterface",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "UnsubscribeButton",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "DeleteCommand",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "GenericResponse",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "ListFiles",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnHMIStatus",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnTouchEvent",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SendHapticData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "Slider",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "UnsubscribeVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": true
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": true
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": true
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": true,
            "parameters": [
                {
                    "name": "accPedalPosition",
                    "key": "accPedalPosition",
                    "selected": false
                },
                {
                    "name": "driverBraking",
                    "key": "driverBraking",
                    "selected": false
                },
                {
                    "name": "myKey",
                    "key": "myKey",
                    "selected": false
                },
                {
                    "name": "rpm",
                    "key": "rpm",
                    "selected": false
                },
                {
                    "name": "beltStatus",
                    "key": "beltStatus",
                    "selected": false
                },
                {
                    "name": "steeringWheelAngle",
                    "key": "steeringWheelAngle",
                    "selected": false
                },
                {
                    "name": "prndl",
                    "key": "prndl",
                    "selected": false
                },
                {
                    "name": "airbagStatus",
                    "key": "airbagStatus",
                    "selected": false
                },
                {
                    "name": "clusterModeStatus",
                    "key": "clusterModeStatus",
                    "selected": false
                },
                {
                    "name": "eCallInfo",
                    "key": "eCallInfo",
                    "selected": false
                },
                {
                    "name": "emergencyEvent",
                    "key": "emergencyEvent",
                    "selected": false
                },
                {
                    "name": "gps",
                    "key": "gps",
                    "selected": false
                },
                {
                    "name": "speed",
                    "key": "speed",
                    "selected": false
                },
                {
                    "name": "bodyInformation",
                    "key": "bodyInformation",
                    "selected": true
                },
                {
                    "name": "deviceStatus",
                    "key": "deviceStatus",
                    "selected": true
                },
                {
                    "name": "engineTorque",
                    "key": "engineTorque",
                    "selected": true
                },
                {
                    "name": "externalTemperature",
                    "key": "externalTemperature",
                    "selected": true
                },
                {
                    "name": "fuelLevel",
                    "key": "fuelLevel",
                    "selected": true
                },
                {
                    "name": "fuelLevel_State",
                    "key": "fuelLevel_State",
                    "selected": true
                },
                {
                    "name": "headLampStatus",
                    "key": "headLampStatus",
                    "selected": true
                },
                {
                    "name": "instantFuelConsumption",
                    "key": "instantFuelConsumption",
                    "selected": true
                },
                {
                    "name": "odometer",
                    "key": "odometer",
                    "selected": true
                },
                {
                    "name": "tirePressure",
                    "key": "tirePressure",
                    "selected": true
                },
                {
                    "name": "wiperStatus",
                    "key": "wiperStatus",
                    "selected": true
                }
            ]
        },
        {
            "name": "UpdateTurnList",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "DiagnosticMessage",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnCommand",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "OnSyncPData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "PutFile",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SetInteriorVehicleData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        },
        {
            "name": "SyncPData",
            "hmi_levels": [
                {
                    "name": "FULL",
                    "value": "FULL",
                    "selected": false
                },
                {
                    "name": "LIMITED",
                    "value": "LIMITED",
                    "selected": false
                },
                {
                    "name": "BACKGROUND",
                    "value": "BACKGROUND",
                    "selected": false
                },
                {
                    "name": "NONE",
                    "value": "NONE",
                    "selected": false
                }
            ],
            "selected": false,
            "parameters": []
        }
    ],
    "user_consent_prompt": "VehicleInfo",
    "is_default": false
}

/*
const funcGroupSql = funcGroup.convertFuncGroupJson(TEST);

const insertFuncMiscFlow = flow([
    flow(setupInsertsSql(app.locals.sql.insert.funcHmiLevels(funcGroupSql[1])), {method: 'parallel'}), //hmi levels
    flow(setupInsertsSql(app.locals.sql.insert.funcParameters(funcGroupSql[2])), {method: 'parallel'}) //parameters
], {method: 'parallel'});

const insertFuncInfoFlow = flow([
    flow(setupInsertsSql(app.locals.sql.insert.funcGroupInfo(funcGroupSql[0])), {method: 'parallel'}), //base info 
    insertFuncMiscFlow
], {method: 'series'});

insertFuncInfoFlow(function (err, res) {
    console.log("DONE");
});

*/
module.exports = {
    get: get,
    postAddGroup: post(false),
    postPromote: post(true),
    delete: del
};