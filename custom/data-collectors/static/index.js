const config = require('../../../settings.js');
const permissions = require('./permissions.js');

module.exports = function (log) {
    //exported functions. these are required to implement
    return {
        //only "next" parameters here because this should be the first module called

        //do not handle
        getAppRequests: function (next) { 
            next(null, []);
        },
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of possible HMI LEVELS as strings
        getHmiLevels: function (next) {
            let hmiLevels = [
                "HMI_NONE",
                "HMI_BACKGROUND",
                "HMI_LIMITED",
                "HMI_FULL"
            ];
            next(null, hmiLevels);
        },
        //do not handle
        getCountries: function (next) {
            next(null, []);
        },        
        //do not handle
        getCategories: function (next) {
            next(null, []);
        },
        //when this function is called, invoke the 'next' function and pass in:
        //  an error if the request failed
        //  an array of valid permission objects
        getPermissions: function (next) {
            next(null, permissions); //get from another module
        },
        //DEPRECATED
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
        //DEPRECATED
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