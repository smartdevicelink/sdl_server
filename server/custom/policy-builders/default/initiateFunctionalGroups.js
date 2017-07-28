module.exports = {
    createDefaultFunctionalGroups: createDefaultFunctionalGroups,
    generateFunctionalGroups: generateFunctionalGroups
};

function createDefaultFunctionalGroups () {
    return [
        defineFunctionGroupInfo("Base-4"),
        defineFunctionGroupInfo("Location-1", "Location"),
        defineFunctionGroupInfo("Notifications", "Notifications"),
        defineFunctionGroupInfo("DrivingCharacteristics-3", "DrivingCharacteristics"),
        defineFunctionGroupInfo("VehicleInfo-3", "VehicleInfo"),
        defineFunctionGroupInfo("PropriataryData-1"),
        defineFunctionGroupInfo("PropriataryData-2"),
        defineFunctionGroupInfo("ProprietaryData-3"),
        defineFunctionGroupInfo("Emergency-1"),
        defineFunctionGroupInfo("Navigation-1"),
        defineFunctionGroupInfo("Base-6"),
        defineFunctionGroupInfo("OnKeyboardInputOnlyGroup"),
        defineFunctionGroupInfo("OnTouchEventOnlyGroup"),
        defineFunctionGroupInfo("DiagnosticMessageOnly"),
        defineFunctionGroupInfo("DataConsent-2", "DataConsent"),
        defineFunctionGroupInfo("BaseBeforeDataConsent"),
        defineFunctionGroupInfo("SendLocation"),
        defineFunctionGroupInfo("WayPoints"),
        defineFunctionGroupInfo("BackgroundAPT")
    ];
}

function generateFunctionalGroups (rpcPermissions, vehiclePermissions) {
    const rpcs = rpcPermissions.map(function (permissionObj) {
        return defineFunctionGroupInfo(permissionObj.rpc_name);
    });
    const vehicles = vehiclePermissions.map(function (permissionObj) {
        return defineFunctionGroupInfo(permissionObj.component_name);
    });
    //combine the arrays
    return rpcs.concat(vehicles);
}

function defineFunctionGroupInfo (propertyName, userConsentPrompt) {
    let obj = {
        property_name: propertyName
    };
    if (userConsentPrompt !== undefined &&  userConsentPrompt !== null) {
        obj.user_consent_prompt = userConsentPrompt;
    }
    return obj;
}