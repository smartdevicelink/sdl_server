//this module stores all data about what the functional group object should be composed of.
//this object contains information about the functional group name, it's user_consent_prompt, and what kind
//of permissions it is meant to contain. this object is a reference for other modules to use

//alwaysAllow property in the functional group means that every app will get access to that group by default
const functionalGroupDataObj = {
    "Base-4": {
        userConsentPrompt: null,
        alwaysAllow: true,
        getPermissionsFunc: base4
    },
    "Location-1": {
        userConsentPrompt: "Location",
        alwaysAllow: false,
        getPermissionsFunc: location1
    },
    "Notifications": {
        userConsentPrompt: "Notifications",
        alwaysAllow: false,
        getPermissionsFunc: notifications
    },
    "DrivingCharacteristics-3": {
        userConsentPrompt: "DrivingCharacteristics",
        alwaysAllow: false,
        getPermissionsFunc: drivingCharacteristics3
    },
    "VehicleInfo-3": {
        userConsentPrompt: "VehicleInfo",
        alwaysAllow: false,
        getPermissionsFunc: vehicleInfo3
    },
    "PropriataryData-1": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: propriataryData1
    },
    "PropriataryData-2": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: propriataryData2
    },
    "ProprietaryData-3": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: proprietaryData3
    },
    "RemoteControl": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: remoteControl
    },
    "Emergency-1": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: emergency1
    },
    "Navigation-1": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: navigation1
    },
    "Base-6": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: base6
    },
    "OnKeyboardInputOnlyGroup": {
        userConsentPrompt: null,
        alwaysAllow: true,
        getPermissionsFunc: onKeyboardInputOnlyGroup
    },
    "OnTouchEventOnlyGroup": {
        userConsentPrompt: null,
        alwaysAllow: true,
        getPermissionsFunc: onTouchEventOnlyGroup
    },
    "DiagnosticMessageOnly": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: diagnosticMessageOnly
    },
    "DataConsent-2": {
        userConsentPrompt: "DataConsent",
        alwaysAllow: false,
        getPermissionsFunc: dataConsent2
    },
    "BaseBeforeDataConsent": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: baseBeforeDataConsent
    },
    "SendLocation": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: sendLocation
    },
    "WayPoints": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: wayPoints
    },
    "BackgroundAPT": {
        userConsentPrompt: null,
        alwaysAllow: false,
        getPermissionsFunc: backgroundApt
    },
    "DialNumberOnlyGroup": {
        userConsentPrompt: null,
        alwaysAllow: true,
        getPermissionsFunc: dialNumberOnly
    },
    "HapticGroup": {
        userConsentPrompt: null,
        alwaysAllow: true,
        getPermissionsFunc: hapticGroup
    }
};

// RPC PERMISSION AND VEHICLE PERMISSION GETTER FUNCTIONS

function base4 () {
    const addRpcArray = [
        "AddCommand",
        "AddSubMenu",
        "Alert",
        "ChangeRegistration",
        "CreateInteractionChoiceSet",
        "DeleteCommand",
        "DeleteFile",
        "DeleteInteractionChoiceSet",
        "DeleteSubMenu",
        "EncodedSyncPData",
        "EndAudioPassThru",
        "GenericResponse",
        "GetSystemCapability",
        "ListFiles",
        "OnAppInterfaceUnregistered",
        "OnAudioPassThru",
        "OnButtonEvent",
        "OnButtonPress",
        "OnCommand",
        "OnDriverDistraction",
        "OnEncodedSyncPData",
        "OnHashChange",
        "OnHMIStatus",
        "OnLanguageChange",
        "OnPermissionsChange",
        "OnSystemRequest",
        "PerformAudioPassThru",
        "PerformInteraction",
        "PutFile",
        "RegisterAppInterface",
        "ResetGlobalProperties",
        "ScrollableMessage",
        "SetAppIcon",
        "SetDisplayLayout",
        "SetGlobalProperties",
        "SetMediaClockTimer",
        "Show",
        "Slider",
        "Speak",
        "SubscribeButton",
        "SystemRequest",
        "UnregisterAppInterface",
        "UnsubscribeButton"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function location1 () {
    const addRpcArray = [];
    const addVehicleArray = [
        "gps",
        "speed"
    ];
    return [addRpcArray, addVehicleArray];
}

function notifications () {
    const addRpcArray = [
        "Alert"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function drivingCharacteristics3 () {
    const addRpcArray = [];
    const addVehicleArray = [
        "accPedalPosition",
        "beltStatus",
        "driverBraking",
        "myKey",
        "prndl",
        "rpm",
        "steeringWheelAngle"
    ];
    return [addRpcArray, addVehicleArray];
}

function vehicleInfo3 () {
    const addRpcArray = [];
    const addVehicleArray = [
        "bodyInformation",
        "deviceStatus",
        "engineTorque",
        "externalTemperature",
        "fuelLevel",
        "fuelLevel_State",
        "headLampStatus",
        "instantFuelConsumption",
        "odometer",
        "tirePressure",
        "vin",
        "wiperStatus"
    ];
    return [addRpcArray, addVehicleArray];
}

function propriataryData1 () {
    const addRpcArray = [
        "DiagnosticMessage",
        "GetDTCs",
        "ReadDID"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function propriataryData2 () {
    const addRpcArray = [
        "DiagnosticMessage",
        "GetDTCs",
        "ReadDID"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function proprietaryData3 () {
    const addRpcArray = [
        "GetDTCs",
        "ReadDID"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function remoteControl () {
    const addRpcArray = [
        "ButtonPress",
        "GetInteriorVehicleData", 
        "SetInteriorVehicleData",
        "OnInteriorVehicleData",
        "SystemRequest"
    ]
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];    
}

function emergency1 () {
    const addRpcArray = [];
    const addVehicleArray = [
        "airbagStatus",
        "clusterModeStatus",
        "eCallInfo",
        "emergencyEvent"
    ];
    return [addRpcArray, addVehicleArray];
}

function navigation1 () {
    const addRpcArray = [
        "AlertManeuver",
        "ShowConstantTBT",
        "UpdateTurnList"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function base6 () {
    const addRpcArray = [
        "AddCommand",
        "AddSubMenu",
        "Alert",
        "ChangeRegistration",
        "CreateInteractionChoiceSet",
        "DeleteCommand",
        "DeleteFile",
        "DeleteInteractionChoiceSet",
        "DeleteSubMenu",
        "EncodedSyncPData",
        "EndAudioPassThru",
        "GenericResponse",
        "ListFiles",
        "OnAppInterfaceUnregistered",
        "OnAudioPassThru",
        "OnButtonEvent",
        "OnButtonPress",
        "OnCommand",
        "OnDriverDistraction",
        "OnEncodedSyncPData",
        "OnHMIStatus",
        "OnLanguageChange",
        "OnPermissionsChange",
        "OnSyncPData",
        "OnTBTClientState",
        "PerformAudioPassThru",
        "PerformInteraction",
        "PutFile",
        "RegisterAppInterface",
        "ResetGlobalProperties",
        "ScrollableMessage",
        "SetAppIcon",
        "SetDisplayLayout",
        "SetGlobalProperties",
        "SetMediaClockTimer",
        "Show",
        "Slider",
        "Speak",
        "SubscribeButton",
        "SyncPData",
        "UnregisterAppInterface",
        "UnsubscribeButton"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function onKeyboardInputOnlyGroup () {
    const addRpcArray = [
        "OnKeyboardInput"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function onTouchEventOnlyGroup () {
    const addRpcArray = [
        "OnTouchEvent"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function diagnosticMessageOnly () {
    const addRpcArray = [
        "DiagnosticMessage"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function dataConsent2 () {
    const addRpcArray = [];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function baseBeforeDataConsent () {
    const addRpcArray = [
        "ChangeRegistration",
        "DeleteFile",
        "EncodedSyncPData",
        "ListFiles",
        "OnAppInterfaceUnregistered",
        "OnEncodedSyncPData",
        "OnHashChange",
        "OnHMIStatus",
        "OnLanguageChange",
        "OnPermissionsChange",
        "OnSystemRequest",
        "PutFile",
        "RegisterAppInterface",
        "ResetGlobalProperties",
        "SetGlobalProperties",
        "SetAppIcon",
        "SetDisplayLayout",
        "SystemRequest",
        "UnregisterAppInterface"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function sendLocation () {
    const addRpcArray = [
        "SendLocation"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function wayPoints () {
    const addRpcArray = [
        "GetWayPoints",
        "SubscribeWayPoints",
        "UnsubscribeWayPoints",
        "OnWayPointChange"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function backgroundApt () {
    const addRpcArray = [
        "EndAudioPassThru",
        "OnAudioPassThru",
        "PerformAudioPassThru"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function dialNumberOnly () {
    const addRpcArray = [
        "DialNumber"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];
}

function hapticGroup () {
    const addRpcArray = [
        "OnTouchEvent",
        "SendHapticData"
    ];
    const addVehicleArray = [];
    return [addRpcArray, addVehicleArray];    
}

module.exports = {
    functionalGroupDataObj: functionalGroupDataObj,
    getAlwaysAllowedGroupNames: function () {
        let allowedGroupNames = [];
        for (let groupName in functionalGroupDataObj) {
            if (functionalGroupDataObj[groupName].alwaysAllow) {
                allowedGroupNames.push(groupName);
            }
        }
        return allowedGroupNames;
    }
}