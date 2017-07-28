const shaidkit = require('shaidkit');
const config = require('../../../config.js');

//initialize the shaid kit
let shaidInitObj = {
    "version": 2,
    "public_key": config.shaidPublicKey,
    "secret_key": config.shaidSecretKey
};

//custom SHAID url option
if (process.env.SHAID_URL) {
    shaidInitObj.base_url = process.env.SHAID_URL;
}

const shaid = new shaidkit(shaidInitObj);

module.exports = function (log) {
    //exported functions. these are required to implement
    return {
        //only a "next" parameter here because this should be the first module called
        getAppRequests: function (next) { 
            //include group name or rpc/parameter for the group
            shaid.read(shaid.entity.application, {}, function (err, res) {
                next(err, res.data.applications);
            }); 
        },
        getHmiLevels: function (next) {
            //no external resource
            let hmiLevels = [
                "HMI_NONE",
                "HMI_BACKGROUND",
                "HMI_LIMITED",
                "HMI_FULL"
            ];
            next(null, hmiLevels);
        },
        getCountries: function (next) {
            shaid.read(shaid.entity.country, {}, function (err, res) {
                next(err, res.data.countries);
            }); 
        },        
        getCategories: function (next) {
            shaid.read(shaid.entity.category, {}, function (err, res) {
                next(err, res.data.categories);
            }); 
        },
        getRpcPermissions: function (next) {
            let rpcPermissions = [
                "RegisterAppInterface",
                "UnregisterAppInterface",
                "SetGlobalProperties",
                "ResetGlobalProperties",
                "AddCommand",
                "DeleteCommand",
                "AddSubMenu",
                "DeleteSubMenu",
                "CreateInteractionChoiceSet",
                "PerformInteraction",
                "DeleteInteractionChoiceSet",
                "Alert",
                "Show",
                "Speak",
                "SetMediaClockTimer",
                "PerformAudioPassThru",
                "EndAudioPassThru",
                "SubscribeButton",
                "UnsubscribeButton",
                "SubscribeVehicleData",
                "UnsubscribeVehicleData",
                "GetVehicleData",
                "ReadDID",
                "GetDTCs",
                "ScrollableMessage",
                "Slider",
                "ShowConstantTBT",
                "AlertManeuver",
                "UpdateTurnList",
                "ChangeRegistration",
                "GenericResponse",
                "PutFile",
                "DeleteFile",
                "ListFiles",
                "SetAppIcon",
                "SetDisplayLayout",
                "DiagnosticMessage",
                "SystemRequest",
                "SendLocation",
                "DialNumber",
                "GetWayPoints",
                "SubscribeWayPoints",
                "UnsubscribeWayPoints",
                "OnHMIStatus",
                "OnAppInterfaceUnregistered",
                "OnButtonEvent",
                "OnButtonPress",
                "OnVehicleData",
                "OnCommand",
                "OnTBTClientState",
                "OnDriverDistraction",
                "OnPermissionsChange",
                "OnAudioPassThru",
                "OnLanguageChange",
                "OnKeyboardInput",
                "OnTouchEvent",
                "OnSystemRequest",
                "OnHashChange",
                "OnWayPointChange",
                "EncodedSyncPData",
                "SyncPData",
                "OnEncodedSyncPData",
                "OnSyncPData"
            ];
            next(null, rpcPermissions);
        },
        getVehicleDataPermissions: function (next) {
            let vehicleDataPermissions = [
                "gps",
                "speed",
                "rpm",
                "fuelLevel",
                "fuelLevel_State",
                "instantFuelConsumption",
                "externalTemperature",
                "prndl",
                "tirePressure",
                "odometer",
                "beltStatus",
                "bodyInformation",
                "deviceStatus",
                "driverBraking",
                "wiperStatus",
                "headLampStatus",
                "engineTorque",
                "accPedalPosition",
                "steeringWheelAngle",
                "eCallInfo",
                "airbagStatus",
                "emergencyEvent",
                "clusterModeStatus",
                "myKey",
                "vin"
            ];
            next(null, vehicleDataPermissions);
        }
    };
}