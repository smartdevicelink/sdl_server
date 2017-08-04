//A module that adds HMI levels to each functional group's permissions
//The HMI levels that are used for each permission are based on the preloaded policy table in sdl_core
const levelsBFLN = ["BACKGROUND", "FULL", "LIMITED", "NONE"];
const levelsBFL = ["BACKGROUND", "FULL", "LIMITED"];
const levelsFL = ["FULL", "LIMITED"];
const levelsF = ["FULL"];
const levelsB = ["BACKGROUND"];

module.exports = function (funcGroupObj) {
    addLevelsToRpc(funcGroupObj, "Base-4", "AddCommand", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "AddSubMenu", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "Alert", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "ChangeRegistration", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "CreateInteractionChoiceSet", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "DeleteCommand", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "DeleteFile", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "DeleteInteractionChoiceSet", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "DeleteSubMenu", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "EncodedSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "EndAudioPassThru", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "GenericResponse", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "ListFiles", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnAppInterfaceUnregistered", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnAudioPassThru", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnButtonEvent", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnButtonPress", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnCommand", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnDriverDistraction", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnEncodedSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnHashChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnHMIStatus", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnLanguageChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnPermissionsChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "OnSystemRequest", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "PerformAudioPassThru", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "PerformInteraction", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "PutFile", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "RegisterAppInterface", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "ResetGlobalProperties", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "ScrollableMessage", levelsF);
    addLevelsToRpc(funcGroupObj, "Base-4", "SetAppIcon", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "SetDisplayLayout", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "SetGlobalProperties", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "SetMediaClockTimer", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "Show", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "Slider", levelsF);
    addLevelsToRpc(funcGroupObj, "Base-4", "Speak", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "SubscribeButton", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-4", "SystemRequest", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "UnregisterAppInterface", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-4", "UnsubscribeButton", levelsBFL);

    quickAddVehicleRpcsBFL(funcGroupObj, "Location-1");

    addLevelsToRpc(funcGroupObj, "Notifications", "Alert", levelsB);

    quickAddVehicleRpcsBFL(funcGroupObj, "DrivingCharacteristics-3");

    quickAddVehicleRpcsBFL(funcGroupObj, "VehicleInfo-3");

    addLevelsToRpc(funcGroupObj, "PropriataryData-1", "DiagnosticMessage", levelsBFL);
    addLevelsToRpc(funcGroupObj, "PropriataryData-1", "GetDTCs", levelsBFL);
    addLevelsToRpc(funcGroupObj, "PropriataryData-1", "ReadDID", levelsBFL);

    addLevelsToRpc(funcGroupObj, "PropriataryData-2", "DiagnosticMessage", levelsBFL);
    addLevelsToRpc(funcGroupObj, "PropriataryData-2", "GetDTCs", levelsBFL);
    addLevelsToRpc(funcGroupObj, "PropriataryData-2", "ReadDID", levelsBFL);

    addLevelsToRpc(funcGroupObj, "ProprietaryData-3", "GetDTCs", levelsBFL);
    addLevelsToRpc(funcGroupObj, "ProprietaryData-3", "ReadDID", levelsBFL);

    quickAddVehicleRpcsBFL(funcGroupObj, "Emergency-1");

    addLevelsToRpc(funcGroupObj, "Navigation-1", "AlertManeuver", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Navigation-1", "ShowConstantTBT", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Navigation-1", "UpdateTurnList", levelsBFL);

    addLevelsToRpc(funcGroupObj, "Base-6", "AddCommand", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "AddSubMenu", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "Alert", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "ChangeRegistration", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "CreateInteractionChoiceSet", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "DeleteCommand", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "DeleteFile", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "DeleteInteractionChoiceSet", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "DeleteSubMenu", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "EncodedSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "EndAudioPassThru", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "GenericResponse", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "ListFiles", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnAppInterfaceUnregistered", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnAudioPassThru", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnButtonEvent", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnButtonPress", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnCommand", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnDriverDistraction", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnEncodedSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnHMIStatus", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnLanguageChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnPermissionsChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "OnTBTClientState", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "PerformAudioPassThru", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "PerformInteraction", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "PutFile", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "RegisterAppInterface", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "ResetGlobalProperties", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "ScrollableMessage", levelsF);
    addLevelsToRpc(funcGroupObj, "Base-6", "SetAppIcon", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "SetDisplayLayout", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "SetGlobalProperties", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "SetMediaClockTimer", levelsF);
    addLevelsToRpc(funcGroupObj, "Base-6", "Show", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "Slider", levelsF);
    addLevelsToRpc(funcGroupObj, "Base-6", "Speak", levelsFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "SubscribeButton", levelsBFL);
    addLevelsToRpc(funcGroupObj, "Base-6", "SyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "UnregisterAppInterface", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "Base-6", "UnsubscribeButton", levelsBFL);

    addLevelsToRpc(funcGroupObj, "OnKeyboardInputOnlyGroup", "OnKeyboardInput", levelsF);

    addLevelsToRpc(funcGroupObj, "OnTouchEventOnlyGroup", "OnTouchEvent", levelsF);

    addLevelsToRpc(funcGroupObj, "DiagnosticMessageOnly", "DiagnosticMessage", levelsBFL);

    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "ChangeRegistration", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "DeleteFile", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "EncodedSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "ListFiles", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnAppInterfaceUnregistered", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnEncodedSyncPData", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnHashChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnHMIStatus", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnLanguageChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnPermissionsChange", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "OnSystemRequest", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "PutFile", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "RegisterAppInterface", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "ResetGlobalProperties", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "SetGlobalProperties", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "SetAppIcon", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "SetDisplayLayout", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "SystemRequest", levelsBFLN);
    addLevelsToRpc(funcGroupObj, "BaseBeforeDataConsent", "UnregisterAppInterface", levelsBFLN);

    addLevelsToRpc(funcGroupObj, "SendLocation", "SendLocation", levelsBFL);

    addLevelsToRpc(funcGroupObj, "WayPoints", "GetWayPoints", levelsBFL);
    addLevelsToRpc(funcGroupObj, "WayPoints", "SubscribeWayPoints", levelsBFL);
    addLevelsToRpc(funcGroupObj, "WayPoints", "UnsubscribeWayPoints", levelsBFL);

    addLevelsToRpc(funcGroupObj, "BackgroundAPT", "EndAudioPassThru", levelsB);
    addLevelsToRpc(funcGroupObj, "BackgroundAPT", "OnAudioPassThru", levelsB);
    addLevelsToRpc(funcGroupObj, "BackgroundAPT", "PerformAudioPassThru", levelsB);

    return funcGroupObj;
}

function quickAddVehicleRpcsBFL (funcGroupObj, name) {
    if (name !== "vin") {
        addLevelsToRpc(funcGroupObj, name, "GetVehicleData", levelsBFL);
        addLevelsToRpc(funcGroupObj, name, "OnVehicleData", levelsBFL);
        addLevelsToRpc(funcGroupObj, name, "SubscribeVehicleData", levelsBFL);
        addLevelsToRpc(funcGroupObj, name, "UnsubscribeVehicleData", levelsBFL);        
    }
    else {
        addLevelsToRpc(funcGroupObj, name, "GetVehicleData", levelsBFL);
    }
}

function addLevelsToRpc (funcGroupObj, name, rpcName, levelsArray) {
    funcGroupObj[name].rpcs[rpcName].hmi_levels = levelsArray;
}