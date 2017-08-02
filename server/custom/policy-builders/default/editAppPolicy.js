module.exports = function (appPolicy, appObj) {
    //permissions are located in properties 'rpcPermissions' and 'vehiclePermissions'
    let vehiclePermissionSet = {};

    //handle vehiclePermissions first because they're easier
    for (let i = 0; i < appObj.vehiclePermissions.length; i++) {
        //given a permission name, get the functionalGroup that holds that permission
        const permName = appObj.vehiclePermissions[i];
        if (location1Perms.indexOf(permName) !== -1) {
            vehiclePermissionSet["Location-1"] = null;
        }
        else if (drivingCharacteristics3Perms.indexOf(permName) !== -1) {
            vehiclePermissionSet["DrivingCharacteristics-3"] = null;
        }
        else if (vehicleInfo3Perms.indexOf(permName) !== -1) {
            vehiclePermissionSet["VehicleInfo-3"] = null;
        }
        else if (emergency1Perms.indexOf(permName) !== -1) {
            vehiclePermissionSet["Emergency-1"] = null;
        }
    }
    //apply the permissions found
    for (let prop in vehiclePermissionSet) {
        appPolicy.groups.push(prop);
    }

    let rpcPermissionSet = {};

    //handle rpc permissions
    for (let i = 0; i < appObj.rpcPermissions.length; i++) {
        //given a permission name, get the functionalGroup that holds that permission
        const permName = appObj.rpcPermissions[i];
        if (base4Perms.indexOf(permName) !== -1) {
            rpcPermissionSet["Base-4"] = null;
        }
        else if (proprietaryDataPerms.indexOf(permName) !== -1) {
            rpcPermissionSet["ProprietaryData-3"] = null;
        }
        else if (navigation1Perms.indexOf(permName) !== -1) {
            rpcPermissionSet["Navigation-1"] = null;
        }
        else if (base6Perms.indexOf(permName) !== -1) {
            rpcPermissionSet["Base-6"] = null;
        }
        else if (onKeyboardInputOnlyPerms.indexOf(permName) !== -1) {
            rpcPermissionSet["OnKeyboardInputOnlyGroup"] = null;
        }
        else if (onTouchEventOnlyPerms.indexOf(permName) !== -1) {
            rpcPermissionSet["OnTouchEventOnlyGroup"] = null;
        }
        else if (diagnosticMessagePerms.indexOf(permName) !== -1) {
            rpcPermissionSet["DiagnosticMessageOnly"] = null;
        }
        else if (sendLocationPerms.indexOf(permName) !== -1) {
            rpcPermissionSet["SendLocation"] = null;
        }
        else if (wayPointsPerms.indexOf(permName) !== -1) {
            rpcPermissionSet["WayPoints"] = null;
        }
        else if (backgroundAptPerms.indexOf(permName) !== -1) {
            rpcPermissionSet["BackgroundAPT"] = null;
        }
    }

    // Specific check for the notification permission group
    if (appObj.can_background_alert) {
        rpcPermissionSet["Notifications"] = null;
    }

    //apply the permissions found
    for (let prop in rpcPermissionSet) {
        appPolicy.groups.push(prop);
    }    
    return appPolicy;
}

//TODO: deduplicate these arrays from createFunctionalGroupPermissions?
//arrays of permissions
const location1Perms = [
    "gps",
    "speed"
];
const drivingCharacteristics3Perms = [
    "accPedalPosition",
    "beltStatus",
    "driverBraking",
    "myKey",
    "prndl",
    "rpm",
    "steeringWheelAngle"
];
const vehicleInfo3Perms = [
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
const emergency1Perms = [
    "airbagStatus",
    "clusterModeStatus",
    "eCallInfo",
    "emergencyEvent"
];

const base4Perms = [
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
const proprietaryDataPerms = [
    "GetDTCs",
    "ReadDID"
];
const navigation1Perms = [
    "AlertManeuver",
    "ShowConstantTBT",
    "UpdateTurnList"
];
const base6Perms = [
    "OnSyncPData",
    "OnTBTClientState",
    "SyncPData",
];
const onKeyboardInputOnlyPerms = [
    "OnKeyboardInput"
];
const onTouchEventOnlyPerms = [
    "OnTouchEvent"
];
const diagnosticMessagePerms = [
    "DiagnosticMessage"
];
const sendLocationPerms = [
    "SendLocation"
];
const wayPointsPerms = [
    "GetWayPoints",
    "SubscribeWayPoints",
    "UnsubscribeWayPoints"
];
const backgroundAptPerms = [
    "EndAudioPassThru",
    "OnAudioPassThru",
    "PerformAudioPassThru"
];
