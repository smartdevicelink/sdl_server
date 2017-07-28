module.exports = {
    generatePermissions: generatePermissions
};

function generatePermissions (rpcPerms, vehiclePerms, functionalGroups) {
    let rpcPermissionObjs = [];
    let vehiclePermissionObjs = [];
    for (let i = 0; i < functionalGroups.length; i++) {
        const perms = createPermissions(rpcPerms, vehiclePerms, functionalGroups[i]);
        rpcPermissionObjs = rpcPermissionObjs.concat(perms.rpcPermissions);
        vehiclePermissionObjs = vehiclePermissionObjs.concat(perms.vehicleDataPermissions);
    }

    return {
        rpcPermissions: rpcPermissionObjs,
        vehicleDataPermissions: vehiclePermissionObjs
    };
}

//if the functional group name matches a value, give it custom-defined permissions
function createPermissions (rpcPerms, vehiclePerms, functionalGroup) {
    const actionObj = {
        "Base-4": base4,
        "Location-1": location1,
        "Notifications": notifications,
        "DrivingCharacteristics-3": drivingCharacteristics3,
        "VehicleInfo-3": vehicleInfo3,
        "PropriataryData-1": propriataryData1,
        "PropriataryData-2": propriataryData2,
        "ProprietaryData-3": proprietaryData3,
        "Emergency-1": emergency1,
        "Navigation-1": navigation1,
        "Base-6": base6,
        "OnKeyboardInputOnlyGroup": onKeyboardInputOnlyGroup,
        "OnTouchEventOnlyGroup": onTouchEventOnlyGroup,
        "DiagnosticMessageOnly": diagnosticMessageOnly,
        "BaseBeforeDataConsent": baseBeforeDataConsent,
        "SendLocation": sendLocation,
        "WayPoints": wayPoints,
        "BackgroundAPT": backgroundApt
    };
    const actionFunc = actionObj[functionalGroup.property_name];

    if (actionFunc) {
        return actionFunc(rpcPerms, vehiclePerms, functionalGroup);
    }
    else {
        //generated functional group. find out if it's for a vehicle parameter or if it's for an rpc parameter
        const permissionPropertyName = functionalGroup.property_name;
        const rpcPermId = findRpcPermissionById(rpcPerms, permissionPropertyName);
        const vehiclePermId = findVehiclePermissionById(vehiclePerms, permissionPropertyName);
        if (rpcPermId !== null) {
            return addPermissionsTemplate(rpcPerms, vehiclePerms, [permissionPropertyName], [], functionalGroup);
        }
        if (vehiclePermId !== null) {
            return addPermissionsTemplate(rpcPerms, vehiclePerms, [], [permissionPropertyName], functionalGroup);
        }        
        //doesn't match anything we have. return empty (example, DataConsent-2 has no permissions so just ignore it)
        return addPermissionsTemplate(rpcPerms, vehiclePerms, [], [], functionalGroup);
    }
}

// RPC PERMISSION AND VEHICLE PERMISSION GENERATOR FUNCTIONS

function base4 (rpcPerms, vehiclePerms, functionalGroup) {
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
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function location1 (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [];
    const addVehicleArray = [
        "gps",
        "speed"
    ];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function notifications (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "Alert"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function drivingCharacteristics3 (rpcPerms, vehiclePerms, functionalGroup) {
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
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function vehicleInfo3 (rpcPerms, vehiclePerms, functionalGroup) {
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
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function propriataryData1 (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "DiagnosticMessage",
        "GetDTCs",
        "ReadDID"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function propriataryData2 (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "DiagnosticMessage",
        "GetDTCs",
        "ReadDID"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function proprietaryData3 (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "GetDTCs",
        "ReadDID"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function emergency1 (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [];
    const addVehicleArray = [
        "airbagStatus",
        "clusterModeStatus",
        "eCallInfo",
        "emergencyEvent"
    ];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function navigation1 (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "AlertManeuver",
        "ShowConstantTBT",
        "UpdateTurnList"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function base6 (rpcPerms, vehiclePerms, functionalGroup) {
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
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function onKeyboardInputOnlyGroup (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "OnKeyboardInput"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function onTouchEventOnlyGroup (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "OnTouchEvent"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function diagnosticMessageOnly (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "DiagnosticMessage"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function baseBeforeDataConsent (rpcPerms, vehiclePerms, functionalGroup) {
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
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function sendLocation (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "SendLocation"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function wayPoints (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "GetWayPoints",
        "SubscribeWayPoints",
        "UnsubscribeWayPoints"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

function backgroundApt (rpcPerms, vehiclePerms, functionalGroup) {
    const addRpcArray = [
        "EndAudioPassThru",
        "OnAudioPassThru",
        "PerformAudioPassThru"
    ];
    const addVehicleArray = [];
    return addPermissionsTemplate(rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup);
}

//HELPER FUNCTIONS

function addPermissionsTemplate (rpcPerms, vehiclePerms, addRpcArray, addVehicleArray, functionalGroup) {
    let rpcPermissions = [];
    let vehicleDataPermissions = [];
    for (let i = 0; i < addRpcArray.length; i++) {
        rpcPermissions.push(addRpcPermission(rpcPerms, addRpcArray[i], functionalGroup));
    }
    for (let i = 0; i < addVehicleArray.length; i++) {
        if (addVehicleArray[i] !== "vin") {
            vehicleDataPermissions.push(addVehiclePermission(rpcPerms, 'OnVehicleData', vehiclePerms, addVehicleArray[i], functionalGroup));
            vehicleDataPermissions.push(addVehiclePermission(rpcPerms, 'GetVehicleData', vehiclePerms, addVehicleArray[i], functionalGroup));
            vehicleDataPermissions.push(addVehiclePermission(rpcPerms, 'SubscribeVehicleData', vehiclePerms, addVehicleArray[i], functionalGroup));
            vehicleDataPermissions.push(addVehiclePermission(rpcPerms, 'UnsubscribeVehicleData', vehiclePerms, addVehicleArray[i], functionalGroup));
        }
        else {
            //vin only makes sense to be associated with a "GetVehicleData" RPC
            vehicleDataPermissions.push(addVehiclePermission(rpcPerms, 'GetVehicleData', vehiclePerms, addVehicleArray[i], functionalGroup));
        }

    }
    return {
        rpcPermissions: rpcPermissions,
        vehicleDataPermissions: vehicleDataPermissions
    };
}

function addRpcPermission (rpcPerms, rpcName, functionalGroup) {
    return {
        function_group_id: functionalGroup.id,
        rpc_id: findRpcPermissionById(rpcPerms, rpcName)
    };
}

function addVehiclePermission (rpcPerms, rpcName, vehiclePerms, vehicleName, functionalGroup) {
    return {
        function_group_id: functionalGroup.id,
        rpc_id: findRpcPermissionById(rpcPerms, rpcName),
        vehicle_id: findVehiclePermissionById(vehiclePerms, vehicleName)
    };
}

function findRpcPermissionById (permissions, name) {
    const perm = permissions.find(function (perm) {
        return perm.rpc_name === name;
    });
    if (perm) {
        return perm.id;
    }
    else {
        return null;
    }
}

function findVehiclePermissionById (permissions, name) {
    const perm = permissions.find(function (perm) {
        return perm.component_name === name;
    });
    if (perm) {
        return perm.id;
    }
    else {
        return null;
    }
}