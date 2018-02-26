const permissions = [
    {name: "RegisterAppInterface", type: "RPC"},
    {name: "UnregisterAppInterface", type: "RPC"},
    {name: "SetGlobalProperties", type: "RPC"},
    {name: "ResetGlobalProperties", type: "RPC"},
    {name: "AddCommand", type: "RPC"},
    {name: "DeleteCommand", type: "RPC"},
    {name: "AddSubMenu", type: "RPC"},
    {name: "DeleteSubMenu", type: "RPC"},
    {name: "CreateInteractionChoiceSet", type: "RPC"},
    {name: "PerformInteraction", type: "RPC"},
    {name: "DeleteInteractionChoiceSet", type: "RPC"},
    {name: "Alert", type: "RPC"},
    {name: "Show", type: "RPC"},
    {name: "Speak", type: "RPC"},
    {name: "SetMediaClockTimer", type: "RPC"},
    {name: "PerformAudioPassThru", type: "RPC"},
    {name: "EndAudioPassThru", type: "RPC"},
    {name: "SubscribeButton", type: "RPC"},
    {name: "UnsubscribeButton", type: "RPC"},
    {name: "SubscribeVehicleData", type: "RPC"},
    {name: "UnsubscribeVehicleData", type: "RPC"},
    {name: "GetVehicleData", type: "RPC"},
    {name: "ReadDID", type: "RPC"},
    {name: "GetDTCs", type: "RPC"},
    {name: "ButtonPress", type: "RPC"},
    {name: "GetInteriorVehicleData", type: "RPC"},
    {name: "SetInteriorVehicleData", type: "RPC"},
    {name: "OnInteriorVehicleData", type: "RPC"},
    {name: "ScrollableMessage", type: "RPC"},
    {name: "Slider", type: "RPC"},
    {name: "ShowConstantTBT", type: "RPC"},
    {name: "AlertManeuver", type: "RPC"},
    {name: "UpdateTurnList", type: "RPC"},
    {name: "ChangeRegistration", type: "RPC"},
    {name: "GenericResponse", type: "RPC"},
    {name: "GetSystemCapability", type: "RPC"},
    {name: "PutFile", type: "RPC"},
    {name: "DeleteFile", type: "RPC"},
    {name: "ListFiles", type: "RPC"},
    {name: "SetAppIcon", type: "RPC"},
    {name: "SetDisplayLayout", type: "RPC"},
    {name: "DiagnosticMessage", type: "RPC"},
    {name: "SystemRequest", type: "RPC"},
    {name: "SendLocation", type: "RPC"},
    {name: "DialNumber", type: "RPC"},
    {name: "GetWayPoints", type: "RPC"},
    {name: "SubscribeWayPoints", type: "RPC"},
    {name: "UnsubscribeWayPoints", type: "RPC"},
    {name: "OnHMIStatus", type: "RPC"},
    {name: "OnAppInterfaceUnregistered", type: "RPC"},
    {name: "OnButtonEvent", type: "RPC"},
    {name: "OnButtonPress", type: "RPC"},
    {name: "OnVehicleData", type: "RPC"},
    {name: "OnCommand", type: "RPC"},
    {name: "OnTBTClientState", type: "RPC"},
    {name: "OnDriverDistraction", type: "RPC"},
    {name: "OnPermissionsChange", type: "RPC"},
    {name: "OnAudioPassThru", type: "RPC"},
    {name: "OnLanguageChange", type: "RPC"},
    {name: "OnKeyboardInput", type: "RPC"},
    {name: "OnTouchEvent", type: "RPC"},
    {name: "SendHapticData", type: "RPC"},
    {name: "OnSystemRequest", type: "RPC"},
    {name: "OnHashChange", type: "RPC"},
    {name: "OnWayPointChange", type: "RPC"},
    {name: "EncodedSyncPData", type: "RPC"},
    {name: "SyncPData", type: "RPC"},
    {name: "OnEncodedSyncPData", type: "RPC"},
    {name: "OnSyncPData", type: "RPC"},
    {name: "gps", type: "PARAMETER"},
    {name: "speed", type: "PARAMETER"},
    {name: "rpm", type: "PARAMETER"},
    {name: "fuelLevel", type: "PARAMETER"},
    {name: "fuelLevel_State", type: "PARAMETER"},
    {name: "instantFuelConsumption", type: "PARAMETER"},
    {name: "externalTemperature", type: "PARAMETER"},
    {name: "prndl", type: "PARAMETER"},
    {name: "tirePressure", type: "PARAMETER"},
    {name: "odometer", type: "PARAMETER"},
    {name: "beltStatus", type: "PARAMETER"},
    {name: "bodyInformation", type: "PARAMETER"},
    {name: "deviceStatus", type: "PARAMETER"},
    {name: "driverBraking", type: "PARAMETER"},
    {name: "wiperStatus", type: "PARAMETER"},
    {name: "headLampStatus", type: "PARAMETER"},
    {name: "engineTorque", type: "PARAMETER"},
    {name: "accPedalPosition", type: "PARAMETER"},
    {name: "steeringWheelAngle", type: "PARAMETER"},
    {name: "eCallInfo", type: "PARAMETER"},
    {name: "airbagStatus", type: "PARAMETER"},
    {name: "emergencyEvent", type: "PARAMETER"},
    {name: "clusterModeStatus", type: "PARAMETER"},
    {name: "myKey", type: "PARAMETER"},
    {name: "vin", type: "PARAMETER"},
    {name: "RADIO", type: "MODULE"},
    {name: "CLIMATE", type: "MODULE"}
];

let permissionRelations = [];
//Any permission that depends on another permission existing is defined here
//For example, vehicle data permissions necessitate having permissions to GetVehicleData, etc.
const allVehicleRpcs = ["OnVehicleData", "GetVehicleData", "SubscribeVehicleData", "UnsubscribeVehicleData"];
const vinVehicleRpcs = ["OnVehicleData", "GetVehicleData"];
const allRemoteControlRpcs = ["ButtonPress", "GetInteriorVehicleData", "SetInteriorVehicleData", "OnInteriorVehicleData", "SystemRequest"];

for (let i = 0; i < permissions.length; i++) {
    const permission = permissions[i];
    if (permission.type === "PARAMETER") { //all vehicle parameters (at least for now...)
        if (permission.name === "vin") {
            addPermissionRelations(permissionRelations, permission.name, vinVehicleRpcs);
        }
        else {
            addPermissionRelations(permissionRelations, permission.name, allVehicleRpcs);
        }
    }
    else if (permission.type === "MODULE") { //all module parameters
        addPermissionRelations(permissionRelations, permission.name, allRemoteControlRpcs);
    }
}

function addPermissionRelations (permissionRelations, permName, parents) {
    for (let i = 0; i < parents.length; i++) {
        permissionRelations.push({
            child_permission_name: permName,
            parent_permission_name: parents[i]
        });
    }
}


module.exports = {
    permissionNames: permissions,
    permissionRelations: permissionRelations
};