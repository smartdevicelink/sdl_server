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
        //only "next" parameters here because this should be the first module called

        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of applications that come from SHAID
        getAppRequests: function (next) { 
            //include group name or rpc/parameter for the group
            shaid.read(shaid.entity.application, {}, function (err, res) {
                next(err, res.data.applications);
            }); 
        },
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of possible HMI LEVELS as strings
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
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid countries that come from SHAID
        getCountries: function (next) {
            shaid.read(shaid.entity.country, {}, function (err, res) {
                next(err, res.data.countries);
            }); 
        },        
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid app categories that come from SHAID
        getCategories: function (next) {
            shaid.read(shaid.entity.category, {}, function (err, res) {
                next(err, res.data.categories);
            }); 
        },
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid RPC permissions as strings
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
                "ButtonPress",
                "GetInteriorVehicleData",
                "SetInteriorVehicleData",
                "OnInteriorVehicleData",
                "SystemRequest",
                "ScrollableMessage",
                "Slider",
                "ShowConstantTBT",
                "AlertManeuver",
                "UpdateTurnList",
                "ChangeRegistration",
                "GenericResponse",
                "GetSystemCapability",
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
                "SendHapticData",
                "OnSystemRequest",
                "OnHashChange",
                "OnWayPointChange",
                "EncodedSyncPData",
                "SyncPData",
                "OnEncodedSyncPData",
                "OnSyncPData",
                "RADIO",
                "CLIMATE"
            ];
            next(null, rpcPermissions);
        },
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid vehicle data permissions as strings
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